"use server";
import { FhirResource, Patient } from "fhir/r4";

import { isFhirResource } from "../shared/constants";

import { CustomQuery } from "./queryExecution/customQuery";
import { GetPhoneQueryFormats } from "../shared/format-service";
import { getSavedQueryByName } from "../shared/database-service";
import type { QueryDataColumn } from "../(pages)/queryBuilding/utils";
import { prepareFhirClient } from "./dbServices/fhir-servers";
import { DibbsValueSet } from "../models/entities/valuesets";
import { auditable } from "./auditLogs/decorator";
import type {
  PatientRecordsRequest,
  QueryResponse,
  PatientDiscoveryRequest,
  FullPatientRequest,
} from "../models/entities/query";

class QueryExecutionService {
  /**
   * Performs a generalized query for collections of patients matching
   * particular criteria. The query is determined by a collection of passed-in
   * valuesets to include in the query results, and any patients found must
   * have eCR data interseecting with these valuesets.
   * @param request Information to pass off to the FHIR server
   * @param valueSetOverrides Any valuesets from the customize query step to override
   * the default saved query for
   * @returns A promise for an updated query response.
   */
  @auditable
  static async patientRecordsQuery(
    request: PatientRecordsRequest,
    valueSetOverrides?: DibbsValueSet[],
  ): Promise<QueryResponse> {
    const queryName = request.query_name;
    const fhirClient = await prepareFhirClient(request.fhir_server);
    const savedQuery = await getSavedQueryByName(request.query_name as string);

    if (!savedQuery) {
      throw new Error(`Unable to query of name ${request?.query_name}`);
    }
    const includeImmunization = savedQuery.immunization;
    const queryData = valueSetOverrides
      ? reconcileSavedQueryDataWithOverrides(
          savedQuery.queryData,
          valueSetOverrides,
        )
      : savedQuery.queryData;

    const builtQuery = new CustomQuery(
      queryData,
      request.patient_id,
      includeImmunization,
    );
    let response: Response | Response[];

    // handle the immunization query using "get" separately since posting against
    // the dev IZ gateway endpoint results in auth errors
    if (queryName?.includes("Immunization")) {
      const { basePath, params } = builtQuery.getQuery("immunization");
      let fetchString = basePath;
      Object.entries(params).forEach(([k, v]) => {
        fetchString += `?${k}=${v}`;
      });
      response = await fhirClient.get(fetchString);
      const queryResponse =
        await QueryExecutionService.parseFhirSearch(response);
      return queryResponse;
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

    const successfulResults = fulfilledResults
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

    response = successfulResults;
    const queryResponse = await QueryExecutionService.parseFhirSearch(response);
    return queryResponse;
  }

  /**
   * Query a FHIR server for a patient based on demographics provided in the request. If
   * a patient is found, store in the queryResponse object.
   * @param request - The request object containing the patient demographics and
   * fhir client info.
   * @returns - The response body from the FHIR server.
   */
  @auditable
  static async patientDiscoveryQuery(
    request: PatientDiscoveryRequest,
  ): Promise<QueryResponse["Patient"]> {
    const fhirClient = await prepareFhirClient(request.fhir_server);

    // Query for patient
    let query = "/Patient?";
    if (request.first_name) {
      query += `given=${request.first_name}&`;
    }
    if (request.last_name) {
      query += `family=${request.last_name}&`;
    }
    if (request.dob) {
      query += `birthdate=${request.dob}&`;
    }
    if (request.mrn) {
      query += `identifier=${request.mrn}&`;
    }
    if (request.phone) {
      // We might have multiple phone numbers if we're coming from the API
      // side, since we parse *all* telecom structs
      const phonesToSearch = request.phone.split(";");
      let phonePossibilities: string[] = [];
      for (const phone of phonesToSearch) {
        let possibilities = await GetPhoneQueryFormats(phone);
        possibilities = possibilities.filter((phone) => phone !== "");
        if (possibilities.length !== 0) {
          phonePossibilities.push(...possibilities);
        }
      }
      if (phonePossibilities.length > 0) {
        query += `phone=${phonePossibilities.join(",")}&`;
      }
    }

    const fhirResponse = await fhirClient.get(query);

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
    const newResponse =
      await QueryExecutionService.parseFhirSearch(fhirResponse);
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
      patient_id: patient[0].id as string,
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

export const patientRecordsQuery = QueryExecutionService.patientRecordsQuery;
export const patientDiscoveryQuery =
  QueryExecutionService.patientDiscoveryQuery;
export const parseFhirSearch = QueryExecutionService.parseFhirSearch;
export const processFhirResponse = QueryExecutionService.processFhirResponse;
export const fullPatientQuery = QueryExecutionService.fullPatientQuery;

// Expected responses from the FHIR server
export type PatientRecordsResponse = Awaited<
  ReturnType<typeof patientRecordsQuery>
>;
export type PatientDiscoveryResponse = Awaited<
  ReturnType<typeof patientDiscoveryQuery>
>;

// Helper function that integrates the selections from the CustomizeQuery page
// into the saved valuesets from build query. Can be deleted if / when we remove
// CustomizeQuery fully
function reconcileSavedQueryDataWithOverrides(
  savedQuery: QueryDataColumn,
  valueSetOverrides: DibbsValueSet[],
) {
  const reconciledQuery: QueryDataColumn = {};

  Object.entries(savedQuery).forEach(([conditionId, valueSetMap]) => {
    reconciledQuery[conditionId] = {};
    Object.entries(valueSetMap).forEach(([vsId, vs]) => {
      const matchedValueSet = valueSetOverrides.find(
        (v) => v.valueSetId === vsId,
      );
      if (matchedValueSet && matchedValueSet.includeValueSet) {
        const filteredValueSet = matchedValueSet;
        filteredValueSet.concepts = matchedValueSet.concepts.filter(
          (c) => c.include,
        );
        reconciledQuery[conditionId][vsId] = filteredValueSet;
      }
      if (matchedValueSet === undefined) {
        reconciledQuery[conditionId][vsId] = vs;
      }
    });
  });

  return reconciledQuery;
}
