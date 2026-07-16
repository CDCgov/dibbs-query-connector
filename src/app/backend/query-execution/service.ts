"use server";
import { Bundle, FhirResource, Medication, Patient, Task } from "fhir/r4";

import { isFhirResource } from "../../constants";

import {
  ChainedPatientDemographics,
  chunkArray,
  CustomQuery,
  extractChainedPatientDemographics,
} from "./custom-query";
import {
  filterMedicationResourcesByCode,
  referencedMedicationKey,
} from "./medication-filter";
import { GetPhoneQueryFormats } from "../../utils/format-service";
import { auditable } from "../audit-logs/decorator";
import type { QueryTableResult } from "../../(pages)/queryBuilding/utils";
import type {
  QueryResponse,
  PatientDiscoveryRequest,
  PatientRecordsRequest,
  FullPatientRequest,
} from "../../models/entities/query";
import {
  getFhirServerConfigs,
  prepareFhirClient,
} from "../fhir-servers/service";
import type FHIRClient from "@/backend/fhir-servers/fhir-client";
import type { FhirRequestRecord } from "@/backend/fhir-servers/fhir-client";
import { getSavedQueryByName } from "../query-building/service";

interface TaskPollingResult {
  tasksBundle: Bundle;
  parentTaskId: string;
}

interface PatientSearchParams {
  firstName?: string;
  lastName?: string;
  dob?: string;
  mrn?: string;
  phone?: string;
  address?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  email?: string;
}

// Constants for configuration
const TASK_POLLING = {
  MAX_ATTEMPTS: 12,
  DELAY_MS: 5000,
  RETRY_DELAY_MS: 5000,
} as const;

// Epic-mode Medication reads (see runEpicMedicationRequestChain) are capped so
// a patient with an enormous medication history can't fan out into an
// unbounded number of requests, and are issued in small concurrent batches to
// avoid hammering the server. Unresolved medications are kept unfiltered by
// the downstream code filter (fail open), so hitting the cap over-includes
// rather than drops records.
const EPIC_MEDICATION_READ_LIMIT = 200;
const EPIC_MEDICATION_READ_BATCH_SIZE = 10;

const TASK_TEMPLATE: Partial<Task> = {
  resourceType: "Task",
  status: "requested",
  intent: "order",
  basedOn: [{ reference: "Task/bundleprofile-fdabest" }],
  code: {
    coding: [
      {
        system: "http://hl7.org/fhir/us/davinci-cdex/CodeSystem/cdex-temp",
        code: "data-request-query",
      },
    ],
  },
  authoredOn: "2025-03-14T02:58:55.179Z",
  lastModified: "2025-03-14T02:58:55.179Z",
  requester: {
    identifier: {
      system: "http://ehealthexchange.org/hub/internal/hcid",
      value: "2.16.840.1.113883.3.7204.1.2.1.1.2.1.19631120",
    },
  },
};

class QueryService {
  /**
   * Builds a FHIR patient search query string from provided parameters
   * @param params - Patient search parameters
   * @returns Promise resolving to a formatted query string
   */
  private static async buildPatientSearchQuery(
    params: PatientSearchParams,
  ): Promise<string> {
    const { firstName, lastName, dob, mrn, phone, address, email } = params;
    let patientQuery = "Patient?";

    if (firstName) patientQuery += `given=${firstName}&`;
    if (lastName) patientQuery += `family=${lastName}&`;
    if (dob) patientQuery += `birthdate=${dob}&`;
    if (mrn) patientQuery += `identifier=${mrn}&`;

    if (phone) {
      const phonesToSearch = phone.split(";");
      const phonePossibilities: string[] = [];

      for (const phoneNumber of phonesToSearch) {
        const possibilities = (await GetPhoneQueryFormats(phoneNumber)).filter(
          (p) => p !== "",
        );
        if (possibilities.length > 0) {
          phonePossibilities.push(...possibilities);
        }
      }

      if (phonePossibilities.length > 0) {
        patientQuery += `phone=${phonePossibilities.join(",")}&`;
      }
    }

    if (address) {
      if (address.street1 || address.street2) {
        const addressLine1 = address.street1?.split(";");
        const addressLine2 = address.street2?.split(";");
        const addrString = [addressLine1, addressLine2]
          .flat()
          .filter((addr) => addr !== "")
          .join(",");

        patientQuery += `address=${addrString}&`;
      }

      if (address.city) {
        const cities = address.city.split(";").join(",");
        patientQuery += `address-city=${cities}&`;
      }

      if (address.zip) {
        const zips = address.zip.split(";").join(",");
        patientQuery += `address-postalcode=${zips}&`;
      }

      if (address.state) {
        const states = address.state.split(";").join(",");
        patientQuery += `address-state=${states}&`;
      }
    }

    if (email) {
      const emailsToSearch = email.split(";");
      if (emailsToSearch.length > 0) {
        patientQuery += `email=${emailsToSearch.join(",")}&`;
      }
    }

    return patientQuery.replace(/&$/, ""); // Remove trailing &
  }

  /**
   * Creates a FHIR Task for patient discovery using mutual TLS
   * @param patientQuery - The patient search query string
   * @returns A FHIR Task resource for patient discovery
   */
  private static createPatientDiscoveryTask(patientQuery: string): Task {
    return {
      ...TASK_TEMPLATE,
      input: [
        {
          type: {
            coding: [
              {
                system:
                  "http://hl7.org/fhir/us/davinci-hrex/CodeSystem/hrex-temp",
                code: "data-query-patient-fhir-fanout",
              },
            ],
          },
          valueString: patientQuery,
        },
        {
          type: {
            coding: [
              {
                system:
                  "http://hl7.org/fhir/us/davinci-cdex/CodeSystem/cdex-temp",
                code: "purpose-of-use",
              },
            ],
          },
          valueCodeableConcept: {
            coding: [
              {
                system: "2.16.840.1.113883.3.18.7.1",
                code: "PUBLICHEALTH",
              },
            ],
          },
        },
      ],
    } as Task;
  }

  /**
   * Polls for task completion and returns the completed tasks bundle
   * @param fhirClient - The FHIR client instance
   * @param parentTaskId - The ID of the parent task to poll
   * @returns Promise resolving to task polling result
   */
  private static async pollTaskCompletion(
    fhirClient: FHIRClient,
    parentTaskId: string,
  ): Promise<TaskPollingResult> {
    let allTasksComplete = false;
    let tasksBundle: Bundle = {
      resourceType: "Bundle",
      type: "searchset",
      entry: [],
    };

    let attempts = 0;
    while (!allTasksComplete && attempts < TASK_POLLING.MAX_ATTEMPTS) {
      attempts++;
      await new Promise((resolve) =>
        setTimeout(resolve, TASK_POLLING.DELAY_MS),
      );

      const childTasksResponse = await fhirClient.get(
        `/Task?part-of=Task/${parentTaskId}`,
      );
      tasksBundle = (await childTasksResponse.json()) as Bundle;

      console.log(
        `Fetched child tasks for parent Task ${parentTaskId}. Attempt ${attempts}/${TASK_POLLING.MAX_ATTEMPTS}`,
      );

      allTasksComplete =
        tasksBundle.entry?.every(
          (entry) =>
            (entry.resource as Task)?.status === "completed" ||
            (entry.resource as Task)?.status === "failed",
        ) ?? false;
    }

    if (!allTasksComplete) {
      console.warn(
        `Task polling timed out after ${TASK_POLLING.MAX_ATTEMPTS} attempts`,
      );
    }

    return { tasksBundle, parentTaskId };
  }

  /**
   * Fetches patient data from a completed task
   * @param fhirClient - The FHIR client instance
   * @param task - The completed Task resource
   * @returns Promise resolving to Patient resource or null if failed
   */
  private static async fetchPatientFromTask(
    fhirClient: FHIRClient,
    task: Task,
  ): Promise<Patient | null> {
    console.log(`Processing Task ${task.id} for patient discovery`);
    if (task.status !== "completed" || !task.output) {
      if (task.status === "failed") {
        console.warn(`Task ${task.id} failed`);
      } else {
        console.warn(
          `Task ${task.id} completed successfully but has no output`,
        );
      }
      return null;
    }

    try {
      const patientLink = task.output?.find((output) =>
        output.valueString?.includes("Patient-Page"),
      )?.valueString;

      if (!patientLink) {
        console.warn(
          `No patient link found in Task output for task ${task.id}`,
        );
        return null;
      }

      console.log(`Patient link found in Task output: ${patientLink}`);

      const url = new URL(patientLink);
      const fullPath = url.pathname;
      const pathParts = fullPath.split("/ndjson");
      const patientPath = "/ndjson" + pathParts[1];

      // Try to fetch patient data with retry logic
      let patientResponse = await fhirClient.get(patientPath);

      if (patientResponse.status !== 200) {
        console.warn(
          `Patient resource not available at ${patientLink}. Retrying...`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, TASK_POLLING.RETRY_DELAY_MS),
        );
        patientResponse = await fhirClient.get(patientPath);
      }

      if (patientResponse.status === 200) {
        const patient = (await patientResponse.json()) as Patient;
        console.log(`Successfully fetched patient from task ${task.id}`);
        return patient;
      } else {
        console.error(
          `Failed to fetch patient resource from ${patientLink}. Status: ${patientResponse.status}`,
        );
        return null;
      }
    } catch (error) {
      console.error(`Error fetching patient from task ${task.id}:`, error);
      return null;
    }
  }

  /**
   * Processes completed tasks to extract patient data
   * @param fhirClient - The FHIR client instance
   * @param tasksBundle - Bundle containing completed tasks
   * @returns Promise resolving to a Bundle with patient results
   */
  private static async processTaskResults(
    fhirClient: FHIRClient,
    tasksBundle: Bundle,
  ): Promise<Bundle> {
    const patientResults = await Promise.all(
      tasksBundle.entry?.map((entry) =>
        entry.resource
          ? this.fetchPatientFromTask(fhirClient, entry.resource as Task)
          : null,
      ) || [],
    );

    const validPatients = patientResults.filter(
      (result): result is Patient => result !== null,
    );

    console.log(
      `Successfully processed ${validPatients.length} patients from ${
        tasksBundle.entry?.length || 0
      } tasks`,
    );

    return {
      resourceType: "Bundle",
      type: "searchset",
      entry: validPatients.map((patient) => ({ resource: patient })),
    };
  }

  /**
   * Handles mutual TLS patient discovery using Task-based workflow
   * @param fhirClient - The FHIR client instance
   * @param patientQuery - The patient search query string
   * @param fhirServer - The name of the FHIR server
   * @returns Promise resolving to a Bundle with patient discovery results
   */
  private static async handleMutualTlsDiscovery(
    fhirClient: FHIRClient,
    patientQuery: string,
    fhirServer: string,
  ): Promise<Bundle> {
    console.log(
      `Mutual TLS enabled for server ${fhirServer}. Using Task resource for patient discovery.`,
    );

    // Create and submit the task
    const taskBody = this.createPatientDiscoveryTask(patientQuery);
    const taskResponse = await fhirClient.postJson("/Task", taskBody);
    const createdTask = (await taskResponse.json()) as Bundle;

    const parentTaskId = createdTask.entry?.[0]?.resource?.id;
    if (!parentTaskId) {
      console.error(
        "Failed to create parent task. Output for task instead was:",
      );
      console.error(createdTask);
      throw new Error("Failed to create parent Task for patient discovery.");
    }

    console.log(`Created Task for patient discovery with ID: ${parentTaskId}`);

    // Poll for completion
    const { tasksBundle } = await this.pollTaskCompletion(
      fhirClient,
      parentTaskId,
    );

    // Process results
    return await this.processTaskResults(fhirClient, tasksBundle);
  }

  /**
   * Handles standard patient discovery using direct FHIR search
   * @param fhirClient - The FHIR client instance
   * @param patientQuery - The patient search query string
   * @returns Promise resolving to the FHIR search response
   */
  private static async handleStandardDiscovery(
    fhirClient: FHIRClient,
    patientQuery: string,
  ): Promise<Response> {
    const query = "/" + patientQuery;
    return await fhirClient.get(query);
  }

  /**
   * Method that coordinates user input and relevant DB config information to make
   * an outgoing FHIR query for patient records
   * @param queryName - name of the stored query
   * @param savedQuery - Table row from the query database
   * @param patientId - ID of the referenced patient
   * @param fhirServer - name of the FHIR server
   * @param patientDemographics - demographics from the discovered Patient,
   * used to build chained Immunization searches against Immunization Gateways
   * @returns a Response with FHIR information for further processing.
   */
  @auditable
  private static async makePatientRecordsRequest(
    savedQuery: QueryTableResult,
    patientId: string,
    fhirServer: string,
    patientDemographics?: ChainedPatientDemographics,
  ) {
    const fhirClient = await prepareFhirClient(fhirServer);
    const serverConfigs = await getFhirServerConfigs();
    const serverConfig = serverConfigs.find(
      (config) => config.name === fhirServer,
    );
    const queryStrategy = serverConfig?.queryStrategy ?? "default";
    const endpointType = serverConfig?.endpointType ?? "standard";
    if (endpointType === "immunization" && !patientDemographics) {
      // The gateway can't resolve a FHIR patient id, so the fallback
      // patient={id} search below will most likely return nothing.
      console.warn(
        "Immunization Gateway query for server %s has no patient demographics; falling back to a patient-id Immunization search.",
        fhirServer,
      );
    }
    const medicalRecordSections = savedQuery.medicalRecordSections;
    const builtQuery = new CustomQuery(savedQuery, patientId, queryStrategy, {
      endpointType,
      patientDemographics,
    });

    // Immunization Gateways only serve immunization history — every other
    // record-section search is a wasted round trip through the HL7v2
    // translation layer that returns nothing, so skip them entirely.
    const isImmunizationGateway = endpointType === "immunization";
    if (isImmunizationGateway) {
      console.log(
        "Immunization Gateway server %s: skipping non-immunization record sections.",
        fhirServer,
      );
    }

    const medicalRecordSectionResults: Response[] = [];
    // Each medical-record-section request is isolated in its own try/catch so a
    // network-level failure (e.g. an unsupported endpoint that resets the
    // connection) on one section can't abort the whole patient record. Non-OK
    // HTTP responses are filtered out further down.
    if (medicalRecordSections && medicalRecordSections.immunizations) {
      try {
        const { basePath, params } = builtQuery.getQuery("immunization");
        // params is a URLSearchParams; stringify it directly. Object.entries()
        // on a URLSearchParams returns [] and would drop the patient filter.
        const fetchString = `${basePath}?${params}`;
        medicalRecordSectionResults.push(await fhirClient.get(fetchString));
      } catch (error) {
        console.error("Immunization FHIR query failed: ", error);
      }
    }

    if (
      !isImmunizationGateway &&
      medicalRecordSections &&
      medicalRecordSections.socialDeterminants
    ) {
      try {
        const { basePath, params } = builtQuery.getQuery("socialHistory");
        medicalRecordSectionResults.push(
          await fhirClient.post(basePath, params),
        );
      } catch (error) {
        console.error("Social history FHIR query failed: ", error);
      }
    }

    if (
      !isImmunizationGateway &&
      medicalRecordSections &&
      medicalRecordSections.serviceRequests
    ) {
      try {
        const { basePath, params } = builtQuery.getQuery("serviceRequest");

        const fetchString = `${basePath}?${params}`;

        // todo: see if we can get this to work with post requests
        medicalRecordSectionResults.push(await fhirClient.get(fetchString));
      } catch (error) {
        console.error("Service request FHIR query failed: ", error);
      }
    }

    const postPromises: Promise<Response | Response[]>[] = isImmunizationGateway
      ? []
      : builtQuery.compileAllPostRequests().map((req) => {
          return fhirClient.post(req.path, req.params);
        });

    if (queryStrategy === "epic" && !isImmunizationGateway) {
      // Epic doesn't support POST _search (or server-side code filtering) for
      // MedicationRequest, so it goes out as a GET alongside the POST batch,
      // followed by reads of any referenced Medications the search didn't
      // include (Epic ignores _include). Medication results are filtered to
      // the query's codes downstream. MedicationStatement isn't queried in
      // Epic mode at all — Epic has no R4 endpoint for it.
      const { basePath, params } = builtQuery.getQuery("medicationRequest");
      if (basePath !== "") {
        postPromises.push(
          QueryService.runEpicMedicationRequestChain(
            fhirClient,
            `${basePath}?${params}`,
          ),
        );
      }
      postPromises.push(
        QueryService.runEpicConditionEncounterChain(fhirClient, builtQuery),
      );
    }

    const postResults = await Promise.allSettled(postPromises);
    const fulfilledResults = postResults
      .flatMap((r) => {
        if (r.status === "fulfilled") {
          return Array.isArray(r.value) ? r.value : [r.value];
        } else {
          console.error("FHIR query promise rejected: ", r.reason);
          return [];
        }
      })
      .filter((v): v is Response => !!v);

    const allResults = [...medicalRecordSectionResults, ...fulfilledResults];
    const successfulResults = allResults
      .map((response) => {
        if (response.status !== 200) {
          response
            .text()
            .then((reason) => {
              // Externally-controlled values (URL, status, response body) are
              // passed as %s args rather than interpolated into the format
              // string so they can't inject format specifiers.
              console.error(
                "FHIR query failed from %s.\n              Status: %s \n Response: %s",
                response.url,
                response.status,
                reason,
              );
            })
            .catch((error) => {
              console.error(
                "FHIR query failed from %s with status %s; reading the error body also failed: ",
                response.url,
                response.status,
                error,
              );
            });
        } else {
          return response;
        }
      })
      .filter((v): v is Response => !!v);

    return {
      responses: successfulResults,
      requests: fhirClient.getRequestLog(),
      medicationFilterCodes:
        queryStrategy === "epic" ? builtQuery.medicationCodes : undefined,
    };
  }

  /**
   * Epic-mode two-step Encounter retrieval. Epic's Encounter reason-code
   * search matches text rather than SNOMED codes, so Encounters are found by
   * first fetching the patient's Conditions that match the query codes, then
   * searching Encounters whose diagnosis references those Conditions. The
   * Condition responses are returned alongside the Encounter responses (they
   * replace the default-mode Condition POST _search).
   * @param fhirClient - client for the FHIR server being queried
   * @param builtQuery - the compiled CustomQuery
   * @returns the Condition and Encounter responses that succeeded
   */
  private static async runEpicConditionEncounterChain(
    fhirClient: FHIRClient,
    builtQuery: CustomQuery,
  ): Promise<Response[]> {
    const conditionQueries = builtQuery.compileEpicConditionQueries();
    if (conditionQueries.length === 0) {
      return [];
    }

    const conditionResults = await Promise.allSettled(
      conditionQueries.map(({ basePath, params }) =>
        fhirClient.get(`${basePath}?${params}`),
      ),
    );
    const conditionResponses = QueryService.collectSettledResponses(
      conditionResults,
      "Epic Condition FHIR query rejected: ",
    );

    // Pull matching Condition ids out of the successful responses. Bodies are
    // cloned because parseFhirSearch reads them again downstream. A Set
    // dedupes Conditions returned by more than one chunked code query (a
    // Condition with several codings can match codes in different chunks).
    const conditionIds = new Set<string>();
    for (const response of conditionResponses) {
      if (response.status !== 200) continue;
      try {
        const bundle = (await response.clone().json()) as Bundle;
        bundle.entry?.forEach((entry) => {
          const resource = entry.resource as FhirResource | undefined;
          if (resource?.resourceType === "Condition" && resource.id) {
            conditionIds.add(resource.id);
          }
        });
      } catch (error) {
        console.error(
          "Failed to parse Epic Condition response for Encounter chaining: ",
          error,
        );
      }
    }

    if (conditionIds.size === 0) {
      console.log(
        "Epic query strategy: no Conditions matched the query codes; skipping the Encounter search",
      );
      return conditionResponses;
    }

    const encounterResults = await Promise.allSettled(
      builtQuery
        .compileEpicEncounterQueries([...conditionIds])
        .map(({ basePath, params }) => fhirClient.get(`${basePath}?${params}`)),
    );
    const encounterResponses = QueryService.collectSettledResponses(
      encounterResults,
      "Epic Encounter FHIR query rejected: ",
    );

    return [...conditionResponses, ...encounterResponses];
  }

  /**
   * Epic-mode MedicationRequest retrieval. Epic's MedicationRequest search
   * ignores `_include=MedicationRequest:medication`, so the Medication
   * resources carrying the drug names and RxNorm codes never accompany the
   * search results — medication names render blank in the UI and the
   * client-side code filter can't evaluate anything. Resolve that here by
   * reading each distinct referenced Medication the search response didn't
   * include. The fetched Medications are returned wrapped in a synthetic
   * Bundle response so the shared search parsing downstream handles them
   * without needing to accept bare read bodies.
   * @param fhirClient - client for the FHIR server being queried
   * @param fetchString - the compiled MedicationRequest GET query
   * @returns the search response, followed by a synthetic Bundle response
   * carrying any Medications the follow-up reads resolved
   */
  private static async runEpicMedicationRequestChain(
    fhirClient: FHIRClient,
    fetchString: string,
  ): Promise<Response[]> {
    const searchResponse = await fhirClient.get(fetchString);
    if (searchResponse.status !== 200) return [searchResponse];

    // Cloned because parseFhirSearch reads the body again downstream.
    let bundle: Bundle;
    try {
      bundle = (await searchResponse.clone().json()) as Bundle;
    } catch (error) {
      console.error(
        "Failed to parse Epic MedicationRequest response for Medication resolution: ",
        error,
      );
      return [searchResponse];
    }

    const includedMedicationIds = new Set<string>();
    const referencedMedicationIds = new Set<string>();
    bundle?.entry?.forEach((entry) => {
      const resource = entry.resource as FhirResource | undefined;
      if (resource?.resourceType === "Medication" && resource.id) {
        includedMedicationIds.add(resource.id);
      }
      if (resource?.resourceType === "MedicationRequest") {
        // Contained (#id) references resolve locally, and a reference with a
        // scheme (an absolute URL, urn:uuid:, urn:oid:) may not resolve
        // against this server — reading it here could fetch an unrelated
        // resource or just burn a guaranteed-404 request — so only scheme-less
        // relative references are read (unresolved orders fail open
        // downstream).
        const reference = resource.medicationReference?.reference;
        if (reference && !reference.includes(":")) {
          const id = referencedMedicationKey(resource);
          if (id) referencedMedicationIds.add(id);
        }
      }
    });

    let idsToRead = [...referencedMedicationIds].filter(
      (id) => !includedMedicationIds.has(id),
    );
    if (idsToRead.length > EPIC_MEDICATION_READ_LIMIT) {
      console.warn(
        "Epic query strategy: %s distinct Medication references exceed the read cap of %s; the excess are kept unfiltered rather than resolved",
        idsToRead.length,
        EPIC_MEDICATION_READ_LIMIT,
      );
      idsToRead = idsToRead.slice(0, EPIC_MEDICATION_READ_LIMIT);
    }

    const medications: Medication[] = [];
    for (const batch of chunkArray(
      idsToRead,
      EPIC_MEDICATION_READ_BATCH_SIZE,
    )) {
      const results = await Promise.allSettled(
        batch.map((id) => fhirClient.get(`/Medication/${id}`)),
      );
      const responses = QueryService.collectSettledResponses(
        results,
        "Epic Medication read rejected: ",
      );
      for (const response of responses) {
        if (response.status !== 200) {
          console.error(
            "Epic Medication read failed from %s with status %s",
            response.url,
            response.status,
          );
          continue;
        }
        try {
          const body = (await response.json()) as FhirResource | null;
          // Only genuine Medication bodies are surfaced; anything else a
          // server returns with a 200 (an error payload, a misrouted
          // resource) is dropped rather than injected into query results.
          if (body?.resourceType === "Medication") {
            medications.push(body);
          }
        } catch (error) {
          console.error("Failed to parse Epic Medication read body: ", error);
        }
      }
    }

    if (medications.length === 0) return [searchResponse];

    const medicationBundle: Bundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: medications.map((medication) => ({ resource: medication })),
    };
    return [
      searchResponse,
      new Response(JSON.stringify(medicationBundle), {
        status: 200,
        headers: { "content-type": "application/fhir+json" },
      }),
    ];
  }

  /**
   * Collects the fulfilled Responses from settled FHIR request promises,
   * logging each rejection under the given message prefix.
   * @param results - settled promises for FHIR requests
   * @param rejectionMessage - log prefix for rejected requests
   * @returns the fulfilled Responses, in order
   */
  private static collectSettledResponses(
    results: PromiseSettledResult<Response>[],
    rejectionMessage: string,
  ): Response[] {
    return results
      .map((r) => {
        if (r.status === "fulfilled") return r.value;
        console.error(rejectionMessage, r.reason);
      })
      .filter((v): v is Response => !!v);
  }

  @auditable
  private static async makePatientDiscoveryRequest(
    request: PatientDiscoveryRequest,
  ): Promise<Response> {
    const { fhirServer } = request;
    const fhirClient = await prepareFhirClient(fhirServer);

    // Get the server config to determine how patient discovery is routed
    const serverConfigs = await getFhirServerConfigs();
    const serverConfig = serverConfigs.find(
      (config) => config.name === fhirServer,
    );

    // Build patient search query
    const patientQuery = await this.buildPatientSearchQuery(request);
    // Handle discovery based on the server's endpoint type. Only fanout servers
    // use the Task-based workflow; standard and immunization-gateway servers use
    // a direct /Patient search.
    let response: Response;
    if (serverConfig?.endpointType === "fanout") {
      const tlsDiscoveryResult = await this.handleMutualTlsDiscovery(
        fhirClient,
        patientQuery,
        fhirServer,
      );

      response = new Response(JSON.stringify(tlsDiscoveryResult), {
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "application/json" }),
      });
    } else {
      response = await this.handleStandardDiscovery(fhirClient, patientQuery);
    }

    // Check for errors
    if (response.status !== 200) {
      let errorText = "Match request failed for unknown reason";
      let headerText = "Match request failed with unknown headers";

      try {
        errorText = await response.text();
      } catch {}

      try {
        headerText = JSON.stringify(
          Object.fromEntries(response.headers.entries()),
        );
      } catch {}

      console.error(
        `Patient search failed. Status: ${response.status} \n Body: ${errorText} \n Headers: ${headerText}`,
      );
    }

    return response;
  }

  /**
   * Sends a FHIR $match operation to the configured FHIR server using patient demographic data.
   * Constructs a Parameters resource containing a Patient resource with identifying fields.
   * Supports optional configuration for match count and match certainty (single/certain).
   * @param request - A PatientDiscoveryRequest object containing demographics and match config
   * @returns A raw FHIR Response from the server (Bundle of potential patient matches)
   */
  @auditable
  private static async makePatientMatchRequest(
    request: PatientDiscoveryRequest,
  ) {
    const {
      fhirServer,
      firstName,
      lastName,
      dob,
      mrn,
      phone,
      address,
      email,
      patientMatchConfiguration,
    } = request;

    const fhirClient = await prepareFhirClient(fhirServer);
    const telecom: { system: string; value: string }[] = [];

    if (phone) {
      const phonesToSearch = phone.split(";");
      for (const phone of phonesToSearch) {
        let possibilities = await GetPhoneQueryFormats(phone);
        possibilities = possibilities.filter((p) => p !== "");
        if (possibilities.length !== 0) {
          telecom.push(
            ...possibilities.map((p) => ({ system: "phone", value: p })),
          );
        }
      }
    }

    if (email) {
      const emailsToSearch = email.split(";").filter(Boolean);
      telecom.push(
        ...emailsToSearch.map((e) => ({ system: "email", value: e })),
      );
    }

    const addressLines: string[] = [];
    if (address?.street1) addressLines.push(...address.street1.split(";"));
    if (address?.street2) addressLines.push(...address.street2.split(";"));

    const patientResource: Record<string, unknown> = {
      resourceType: "Patient",
    };

    if (firstName || lastName) {
      patientResource["name"] = [
        {
          given: firstName ? [firstName] : [],
          family: lastName || "",
        },
      ];
    }

    if (dob) {
      patientResource["birthdate"] = dob;
    }

    if (telecom.length > 0) {
      patientResource["telecom"] = telecom;
    }

    if (
      addressLines.length > 0 ||
      address?.city ||
      address?.state ||
      address?.zip
    ) {
      patientResource["address"] = [
        {
          line: addressLines.length > 0 ? addressLines : undefined,
          city: address?.city || undefined,
          state: address?.state || undefined,
          postalCode: address?.zip || undefined,
        },
      ];
    }

    if (mrn) {
      patientResource["identifier"] = [
        {
          value: mrn,
        },
      ];
    }

    const hasIdentifiers = [
      "name",
      "birthDate",
      "telecom",
      "address",
      "identifier",
    ].some((key) => patientResource[key] !== undefined);

    if (!hasIdentifiers) {
      throw new Error(
        "Cannot run $match: Patient resource has no identifying fields.",
      );
    }

    const parameters: {
      resourceType: "Parameters";
      parameter: Array<
        | { name: "resource"; resource: Record<string, unknown> }
        | { name: "count"; valueInteger: number }
        | { name: "onlyCertainMatches"; valueBoolean: true }
        | { name: "onlySingleMatch"; valueBoolean: true }
      >;
    } = {
      resourceType: "Parameters",
      parameter: [
        {
          name: "resource",
          resource: patientResource,
        },
      ],
    };

    // Apply optional match modifiers
    if (patientMatchConfiguration?.onlyCertainMatches) {
      parameters.parameter.push({
        name: "onlyCertainMatches",
        valueBoolean: true,
      });
      if (patientMatchConfiguration?.matchCount > 0) {
        parameters.parameter.push({
          name: "count",
          valueInteger: patientMatchConfiguration.matchCount,
        });
      }
    }

    if (patientMatchConfiguration?.onlySingleMatch) {
      parameters.parameter.push({
        name: "onlySingleMatch",
        valueBoolean: true,
      });
    }

    const response = await fhirClient.postJson("/Patient/$match", parameters);
    const jsonBody: {
      resourceType: "OperationOutcome";
      issue?: {
        details?: { text?: string };
      }[];
    } = await response.clone().json();

    const noCertainMatch =
      jsonBody.resourceType === "OperationOutcome" &&
      jsonBody.issue?.some((i) =>
        i.details?.text?.includes("did not find a certain match"),
      );

    if (noCertainMatch) {
      console.warn("Match failed due to uncertain results.");
      return new Response(JSON.stringify({ uncertainMatchError: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (response.status !== 200) {
      let errorText = "Match request failed for unknown reason";
      let headerText = "Match request failed with unknown headers";

      try {
        errorText = await response.text();
      } catch {}

      try {
        headerText = JSON.stringify(
          Object.fromEntries(response.headers.entries()),
        );
      } catch {}

      console.error(
        `Patient search failed. Status: ${response.status} \n Body: ${errorText} \n Headers: ${headerText}`,
      );
    }

    return response;
  }

  /**
   * Performs a generalized query for collections of patients matching
   * particular criteria. The query is determined by a collection of passed-in
   * valuesets to include in the query results, and any patients found must
   * have eCR data interseecting with these valuesets.
   * @param request Information to pass off to the FHIR server
   * @returns A promise for an updated query response.
   */
  static async patientRecordsQuery(
    request: PatientRecordsRequest,
  ): Promise<QueryResponse & { fhirRequests: FhirRequestRecord[] }> {
    const savedQuery = await getSavedQueryByName(request.queryName as string);

    if (!savedQuery) {
      throw new Error(`Unable to query of name ${request?.queryName}`);
    }

    // Only the slim demographics cross into the @auditable records request —
    // the same PHI level makePatientDiscoveryRequest already audits — so the
    // full Patient resource never lands in the audit log.
    const patientDemographics = request.patient
      ? extractChainedPatientDemographics(request.patient)
      : undefined;

    const { responses, requests, medicationFilterCodes } =
      await QueryService.makePatientRecordsRequest(
        savedQuery,
        request.patientId,
        request.fhirServer,
        patientDemographics,
      );

    let queryResponse = await QueryService.parseFhirSearch(responses);

    // Set when the server's search API couldn't filter medications by code
    // (Epic); apply the query's medication codes client-side instead.
    if (medicationFilterCodes && medicationFilterCodes.length > 0) {
      queryResponse = filterMedicationResourcesByCode(
        queryResponse,
        medicationFilterCodes,
      );
    }

    return { ...queryResponse, fhirRequests: requests };
  }

  /**
   * Query a FHIR server for a patient based on demographics provided in the request. If
   * a patient is found, store in the queryResponse object.
   * @param request - The request object containing the patient demographics and
   * fhir client info.
   * @returns - The response body from the FHIR server.
   */
  static async patientDiscoveryQuery(
    request: PatientDiscoveryRequest,
  ): Promise<QueryResponse["Patient"] | { uncertainMatchError: true }> {
    const matchConfig = request.patientMatchConfiguration;
    const useDollarMatchStrategy =
      matchConfig?.supportsMatch && matchConfig.enabled;

    let fhirResponse: Response;
    if (useDollarMatchStrategy) {
      fhirResponse = await QueryService.makePatientMatchRequest(request);
      if (
        fhirResponse.status === 200 &&
        fhirResponse.headers.get("content-type")?.includes("application/json")
      ) {
        const body = await fhirResponse.clone().json();
        if (body?.uncertainMatchError === true) {
          return { uncertainMatchError: true };
        }
      }
    } else {
      fhirResponse = await QueryService.makePatientDiscoveryRequest(request);
    }

    const newResponse = await QueryService.parseFhirSearch(fhirResponse);
    return newResponse["Patient"] as Patient[];
  }

  static async fullPatientQuery(
    queryRequest: FullPatientRequest,
  ): Promise<QueryResponse> {
    const patient = await patientDiscoveryQuery(queryRequest);

    if (!Array.isArray(patient) || patient.length === 0) {
      throw Error("Patient not found in full patient discovery");
    }

    // TODO: First patient is assumed to be the correct one.
    // This should be handled by the UI, where the user can select the correct patient, but what about the API?
    // Drop fhirRequests here so the captured requests stay UI-only and never
    // leak into the public /api/query Bundle output.
    const { fhirRequests: _fhirRequests, ...patientRecords } =
      await patientRecordsQuery({
        patientId: patient[0].id as string,
        ...queryRequest,
        patient: patient[0],
      });
    return {
      Patient: patient,
      ...patientRecords,
    };
  }

  /**
   * Type guard to check if an object is a FHIR Bundle
   * @param obj - The object to check
   * @returns True if the object is a Bundle, false otherwise
   */
  static isBundle(obj: unknown): obj is Bundle {
    return (
      obj !== null &&
      typeof obj === "object" &&
      (obj as { resourceType?: string }).resourceType === "Bundle"
    );
  }

  /**
   * Parse the response from a FHIR search query. If the response is successful and
   * contains data, return an array of parsed resources.
   * @param response - The response from the FHIR server.
   * @returns - The parsed response.
   */
  static async parseFhirSearch(
    response: Response | Array<Response> | Bundle,
  ): Promise<QueryResponse> {
    let resourceArray: FhirResource[] = [];
    const resourceIds = new Set<string>();
    const responders = new Set<string>();
    const isFanoutSearch = QueryService.isBundle(response);

    // Process the responses and flatten them
    if (Array.isArray(response)) {
      // Parse each response independently so one unparseable response can't
      // abort the others (allSettled instead of all). processFhirResponse is
      // already guarded, so rejections here are defense-in-depth.
      const settled = await Promise.allSettled(
        response.map(processFhirResponse),
      );
      resourceArray = settled
        .map((r) => {
          if (r.status === "fulfilled") {
            return r.value;
          }
          console.error("Parsing a FHIR response failed: ", r.reason);
          return [];
        })
        .flat();
      // if response is a Bundle, extract the resource
    } else if (isFanoutSearch) {
      const resources =
        response.entry
          ?.map((entry) => {
            if (entry.resource && isFhirResource(entry.resource)) {
              return entry.resource;
            } else {
              console.error(
                "Entry in FHIR Bundle response parsing was of unexpected shape",
              );
              return null;
            }
          })
          .filter((resource): resource is FhirResource => resource !== null) ||
        [];
      // Add resources to the resourceArray
      resourceArray = resources;
    } else {
      resourceArray = await processFhirResponse(response);
    }

    const runningQueryResponse: QueryResponse = {};
    // Add resources to queryResponse
    for (const resource of resourceArray) {
      const resourceType = resource.resourceType;

      // Check if resourceType already exists in queryResponse & initialize if not
      if (!(resourceType in runningQueryResponse)) {
        runningQueryResponse[resourceType] = [];
      }
      // Dedupe on type-qualified ids: FHIR ids are only unique per resource
      // type, so two different resources can legitimately share a bare id.
      const resourceKey = `${resourceType}/${resource.id}`;
      // Check if the resourceID has already been seen & only added resources that haven't been seen before
      if (resource.id && !resourceIds.has(resourceKey)) {
        (runningQueryResponse[resourceType] as FhirResource[]).push(resource);
        resourceIds.add(resourceKey);
      } else if (resource.id && isFanoutSearch) {
        // If this is a fanout search, we might have multiple resources with the same ID
        // In this case, we still want to add the resource to the response if it comes from a different server
        const targetResponderFullUrl = (resource as Patient).identifier?.find(
          (identifier) => identifier.system?.includes("targetResponderFullUrl"),
        )?.value;
        console.log(
          `Processing resource with ID ${resource.id} and targetResponderFullUrl ${targetResponderFullUrl}`,
        );
        // If the targetResponderFullUrl is defined and not already in the responders set, add
        if (targetResponderFullUrl && !responders.has(targetResponderFullUrl)) {
          (runningQueryResponse[resourceType] as FhirResource[]).push(resource);
          responders.add(targetResponderFullUrl);
        }
      }
    }
    return runningQueryResponse;
  }

  /**
   * Process the response from a FHIR search query. If the response is successful and
   * contains data, return an array of resources that are ready to be parsed.
   * @param response - The response from the FHIR server.
   * @returns - The array of resources from the response.
   */
  static async processFhirResponse(
    response: Response,
  ): Promise<FhirResource[]> {
    let resourceArray: FhirResource[] = [];
    let resourceIds: string[] = [];

    if (response.status === 200) {
      let body: Bundle | null;
      try {
        body = (await response.json()) as Bundle | null;
      } catch (error) {
        // A 200 with a malformed/non-JSON body shouldn't abort parsing of the
        // other resources — log and treat this response as empty. response.url
        // is passed as a %s arg (not interpolated into the format string) so an
        // externally-controlled URL can't smuggle in format specifiers.
        console.error(
          "Failed to parse FHIR response body from %s: ",
          response.url,
          error,
        );
        return resourceArray;
      }
      // A body that parses to JSON null or a non-object is still valid JSON (so
      // it slips past the catch above) but has no entries; optional chaining
      // keeps the body.entry access from throwing on those values.
      if (body?.entry) {
        for (const entry of body.entry) {
          if (entry.resource && isFhirResource(entry.resource)) {
            // Add the resource only if the ID is unique to the resources being
            // returned for the query. Ids are type-qualified: FHIR ids are
            // only unique per resource type.
            const resourceKey = `${entry.resource.resourceType}/${entry.resource.id}`;
            if (!resourceIds.includes(resourceKey)) {
              resourceIds.push(resourceKey);
              resourceArray.push(entry.resource);
            }
          } else {
            console.error(
              "Entry in FHIR resource response parsing was of unexpected shape",
            );
          }
        }
      }
    }
    return resourceArray;
  }
}

export const patientRecordsQuery = QueryService.patientRecordsQuery;
export const patientDiscoveryQuery = QueryService.patientDiscoveryQuery;
export const parseFhirSearch = QueryService.parseFhirSearch;
export const processFhirResponse = QueryService.processFhirResponse;
export const fullPatientQuery = QueryService.fullPatientQuery;

// Expected responses from the FHIR server
export type PatientRecordsResponse = Awaited<
  ReturnType<typeof patientRecordsQuery>
>;
export type PatientDiscoveryResponse = Awaited<
  ReturnType<typeof patientDiscoveryQuery>
>;
