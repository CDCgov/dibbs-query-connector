"use server";
import { Bundle, FhirResource, Patient, Task } from "fhir/r4";

import { isFhirResource } from "../shared/constants";

import { CustomQuery } from "../shared/CustomQuery";
import { GetPhoneQueryFormats } from "../shared/format-service";
import { getSavedQueryByName } from "../shared/database-service";
import { auditable } from "./audit-logs/decorator";
import type { QueryDataColumn } from "../(pages)/queryBuilding/utils";
import type {
  QueryResponse,
  PatientDiscoveryRequest,
  PatientRecordsRequest,
  FullPatientRequest,
} from "../models/entities/query";
import type { MedicalRecordSections } from "../(pages)/queryBuilding/utils";
import { getFhirServerConfigs, prepareFhirClient } from "./fhir-servers";
import type FHIRClient from "../shared/fhirClient";

interface TaskPollingResult {
  tasksBundle: Bundle<Task>;
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
    let tasksBundle: Bundle<Task> = {
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
      tasksBundle = (await childTasksResponse.json()) as Bundle<Task>;

      console.log(
        `Fetched child tasks for parent Task ${parentTaskId}. Attempt ${attempts}/${TASK_POLLING.MAX_ATTEMPTS}`,
      );

      allTasksComplete =
        tasksBundle.entry?.every(
          (entry) =>
            entry.resource?.status === "completed" ||
            entry.resource?.status === "failed",
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
      const taskDetailResponse = await fhirClient.get(`/Task/${task.id}`);
      const taskDetail = (await taskDetailResponse.json()) as Task;

      const patientLink = taskDetail.output?.find((output) =>
        output.valueString?.includes("Patient-Page1"),
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
    tasksBundle: Bundle<Task>,
  ): Promise<Bundle> {
    const patientResults = await Promise.all(
      tasksBundle.entry?.map((entry) =>
        entry.resource
          ? this.fetchPatientFromTask(fhirClient, entry.resource)
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
    const createdTask = (await taskResponse.json()) as Bundle<Task>;

    const parentTaskId = createdTask.entry?.[0]?.resource?.id;
    if (!parentTaskId) {
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
   * @param queryData - JSON blob with mapped valueset information
   * to pull back the relevant FHIR resources
   * @param patientId - ID of the referenced patient
   * @param fhirServer - name of the FHIR server
   * @param  medicalRecordSections - whether to include medical record sections
   * @returns a Response with FHIR information for further processing.
   */
  @auditable
  private static async makePatientRecordsRequest(
    queryData: QueryDataColumn,
    patientId: string,
    fhirServer: string,
    medicalRecordSections: MedicalRecordSections,
  ) {
    const fhirClient = await prepareFhirClient(fhirServer);
    const builtQuery = new CustomQuery(
      queryData,
      patientId,
      medicalRecordSections,
    );

    const medicalRecordSectionResults: Response[] = [];
    if (medicalRecordSections && medicalRecordSections.immunizations) {
      const { basePath, params } = builtQuery.getQuery("immunization");
      let fetchString = basePath;
      Object.entries(params).forEach(([k, v]) => {
        fetchString += `?${k}=${v}`;
      });
      medicalRecordSectionResults.push(await fhirClient.get(fetchString));
    }

    if (medicalRecordSections && medicalRecordSections.socialDeterminants) {
      const { basePath, params } = builtQuery.getQuery("socialHistory");
      medicalRecordSectionResults.push(await fhirClient.post(basePath, params));
    }

    const postPromises = builtQuery.compileAllPostRequests().map((req) => {
      return fhirClient.post(req.path, req.params);
    });

    const postResults = await Promise.allSettled(postPromises);
    const fulfilledResults = postResults
      .map((r) => {
        if (r.status === "fulfilled") {
          return r.value;
        } else {
          console.error("POST to FHIR query promise rejected: ", r.reason);
        }
      })
      .filter((v): v is Response => !!v);

    const allResults = [...medicalRecordSectionResults, ...fulfilledResults];
    const successfulResults = allResults
      .map((response) => {
        if (response.status !== 200) {
          response.text().then((reason) => {
            console.error(
              `FHIR query failed from ${response.url}. 
              Status: ${response.status} \n Response: ${reason}`,
            );
          });
        } else {
          return response;
        }
      })
      .filter((v): v is Response => !!v);

    return successfulResults;
  }

  @auditable
  private static async makePatientDiscoveryRequest(
    request: PatientDiscoveryRequest,
  ): Promise<Response> {
    const { fhirServer } = request;
    const fhirClient = await prepareFhirClient(fhirServer);

    // Get the server config to check for mutual TLS
    const serverConfigs = await getFhirServerConfigs();
    const serverConfig = serverConfigs.find(
      (config) => config.name === fhirServer,
    );

    // Build patient search query
    const patientQuery = await this.buildPatientSearchQuery(request);
    // Handle discovery based on server configuration
    let response: Response;
    if (serverConfig?.mutualTls) {
      const tlsDiscoveryResult = await this.handleMutualTlsDiscovery(
        fhirClient,
        patientQuery,
        fhirServer,
      );

      response = new Response(JSON.stringify(tlsDiscoveryResult), {
        status: 200,
        statusText: "OK",
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
      patientResource["birthDate"] = dob;
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
  ): Promise<QueryResponse> {
    const savedQuery = await getSavedQueryByName(request.queryName as string);

    if (!savedQuery) {
      throw new Error(`Unable to query of name ${request?.queryName}`);
    }

    const medicalRecordSections = savedQuery.medicalRecordSections;
    const queryData = savedQuery.queryData;

    let response: Response | Response[] =
      await QueryService.makePatientRecordsRequest(
        queryData,
        request.patientId,
        request.fhirServer,
        medicalRecordSections,
      );

    const queryResponse = await QueryService.parseFhirSearch(response);
    return queryResponse;
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

    const fhirResponse =
      matchConfig?.supportsMatch && matchConfig.enabled
        ? await QueryService.makePatientMatchRequest(request)
        : await QueryService.makePatientDiscoveryRequest(request);

    if (
      fhirResponse.status === 200 &&
      fhirResponse.headers.get("content-type")?.includes("application/json")
    ) {
      const body = await fhirResponse.clone().json();

      if (body?.uncertainMatchError === true) {
        return { uncertainMatchError: true };
      }
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
    const patientRecords = await patientRecordsQuery({
      patientId: patient[0].id as string,
      ...queryRequest,
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
      resourceArray = (
        await Promise.all(response.map(processFhirResponse))
      ).flat();
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
      // Check if the resourceID has already been seen & only added resources that haven't been seen before
      if (resource.id && !resourceIds.has(resource.id)) {
        (runningQueryResponse[resourceType] as FhirResource[]).push(resource);
        resourceIds.add(resource.id);
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
      const body = (await response.json()) as Bundle;
      if (body.entry) {
        for (const entry of body.entry) {
          if (entry.resource && isFhirResource(entry.resource)) {
            // Add the resource only if the ID is unique to the resources being returned for the query
            if (!resourceIds.includes(entry.resource.id!)) {
              resourceIds.push(entry.resource.id!);
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
