"use server";
import { FhirResource, Patient } from "fhir/r4";

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
import { prepareFhirClient } from "./fhir-servers";

class QueryService {
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
    queryName: string,
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
  ) {
    const { fhirServer, firstName, lastName, dob, mrn, phone, address, email } =
      request;

    const fhirClient = await prepareFhirClient(fhirServer);

    // Get the server config to check for mutual TLS
    const { getFhirServerConfigs } = await import("./fhir-servers");
    const serverConfigs = await getFhirServerConfigs();
    const serverConfig = serverConfigs.find(
      (config) => config.name === fhirServer,
    );

    // Check if this server has mutual TLS enabled
    const isMutualTlsEnabled = serverConfig?.mutualTls === true;

    // Build patient search query
    let patientQuery = "Patient?";
    if (firstName) {
      patientQuery += `given=${firstName}&`;
    }
    if (lastName) {
      patientQuery += `family=${lastName}&`;
    }
    if (dob) {
      patientQuery += `birthdate=${dob}&`;
    }
    if (mrn) {
      patientQuery += `identifier=${mrn}&`;
    }
    if (phone) {
      // We might have multiple phone numbers if we're coming from the API
      // side, since we parse *all* telecom structs
      const phonesToSearch = phone.split(";");
      let phonePossibilities: string[] = [];
      for (const phone of phonesToSearch) {
        let possibilities = await GetPhoneQueryFormats(phone);
        possibilities = possibilities.filter((phone) => phone !== "");
        if (possibilities.length !== 0) {
          phonePossibilities.push(...possibilities);
        }
      }
      if (phonePossibilities.length > 0) {
        patientQuery += `phone=${phonePossibilities.join(",")}&`;
      }
    }
    if (address?.street1 || address?.street2) {
      const addressLine1 = address?.street1?.split(";");
      const addressLine2 = address?.street2?.split(";");

      const addrString = [addressLine1, addressLine2]
        .flat()
        .filter((addr) => addr != "")
        .join(",");

      patientQuery += `address=${addrString}&`;
    }
    if (address?.city) {
      const cities = address?.city?.split(";").join(",");
      patientQuery += `address-city=${cities}&`;
    }
    if (address?.state) {
      const states = address?.state.split(";").join(",");
      patientQuery += `address-state=${states}&`;
    }
    if (address?.zip) {
      const zips = address?.zip.split(";").join(",");
      patientQuery += `address-postalcode=${zips}&`;
    }
    if (email) {
      const emailsToSearch = email.split(";");
      if (emailsToSearch.length > 0) {
        patientQuery += `email=${emailsToSearch.join(",")}&`;
      }
    }

    let fhirResponse: Response;

    if (isMutualTlsEnabled) {
      // For mutual TLS enabled servers, send POST to /Task
      const taskBody = {
        resourceType: "Task",
        status: "requested",
        intent: "order",
        code: {
          coding: [
            {
              system:
                "http://hl7.org/fhir/us/davinci-cdex/CodeSystem/cdex-temp",
              code: "data-request-query",
            },
          ],
        },
        authoredOn: new Date().toISOString(),
        lastModified: new Date().toISOString(),
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
      };

      fhirResponse = await fhirClient.postJson("/Task", taskBody);
      // log the response for debugging
      console.log(
        `FHIR Task POST response: ${fhirResponse.status} - ${await fhirResponse.text()}`,
      );
    } else {
      // For non-mutual TLS servers, use the original GET to /Patient
      const query = "/" + patientQuery;
      fhirResponse = await fhirClient.get(query);
    }

    // Check for errors
    if (fhirResponse.status !== 200) {
      console.error(
        `Patient search failed. Status: ${
          fhirResponse.status
        } \n Body: ${await fhirResponse.text()} \n Headers: ${JSON.stringify(
          Object.fromEntries(fhirResponse.headers.entries()),
        )}`,
      );
    }

    return fhirResponse;
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
        request.queryName,
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
  ): Promise<QueryResponse["Patient"]> {
    const fhirResponse =
      await QueryService.makePatientDiscoveryRequest(request);
    const newResponse = await QueryService.parseFhirSearch(fhirResponse);
    return newResponse["Patient"] as Patient[];
  }

  static async fullPatientQuery(
    queryRequest: FullPatientRequest,
  ): Promise<QueryResponse> {
    const patient = await patientDiscoveryQuery(queryRequest);
    if (patient === undefined || patient.length === 0) {
      throw Error("Patient not found in full patient discovery");
    }

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
   * Parse the response from a FHIR search query. If the response is successful and
   * contains data, return an array of parsed resources.
   * @param response - The response from the FHIR server.
   * @returns - The parsed response.
   */
  static async parseFhirSearch(
    response: Response | Array<Response>,
  ): Promise<QueryResponse> {
    let resourceArray: FhirResource[] = [];
    const resourceIds = new Set<string>();

    // Process the responses and flatten them
    if (Array.isArray(response)) {
      resourceArray = (
        await Promise.all(response.map(processFhirResponse))
      ).flat();
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
      const body = await response.json();
      if (body.entry) {
        for (const entry of body.entry) {
          if (!isFhirResource(entry.resource)) {
            console.error(
              "Entry in FHIR resource response parsing was of unexpected shape",
            );
          }
          // Add the resource only if the ID is unique to the resources being returned for the query
          if (!resourceIds.includes(entry.resource.id)) {
            resourceIds.push(entry.resource.id);
            resourceArray.push(entry.resource);
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
