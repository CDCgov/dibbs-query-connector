"use server";
import https from "https";
import { Bundle, FhirResource, Patient } from "fhir/r4";

import { isFhirResource } from "../shared/constants";

import { CustomQuery } from "./CustomQuery";
import { GetPhoneQueryFormats } from "./format-service";
import { getSavedQueryByName } from "./database-service";
import type { QueryDataColumn } from "../(pages)/queryBuilding/utils";
import { getFhirServerConfigs } from "../backend/dbServices/fhir-servers";
import { DibbsValueSet } from "../models/entities/valuesets";
import { auditable } from "../backend/auditLogs/decorator";
import FHIRClient from "./fhirClient";
import { FhirServerConfig } from "../models/entities/fhir-servers";

/**
 * The query response when the request source is from the Viewer UI.
 */
export type QueryResponse = {
  [R in FhirResource as R["resourceType"]]?: R[];
};

export type APIQueryResponse = Bundle;

export type PatientDiscoveryRequest = {
  fhir_server: string;
  first_name?: string;
  last_name?: string;
  dob?: string;
  mrn?: string;
  phone?: string;
};
export type PatientRecordsRequest = {
  patient_id: string;
  fhir_server: string;
  query_name: string;
};

export type FullPatientRequest = PatientDiscoveryRequest &
  Omit<PatientRecordsRequest, "patient_id">;

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

/**
 * Create a FHIR Bundle from the query response.
 * @param queryResponse - The response object to store the results.
 * @returns - The FHIR Bundle of queried data.
 */
export async function createBundle(
  queryResponse: QueryResponse,
): Promise<APIQueryResponse> {
  const bundle: Bundle = {
    resourceType: "Bundle",
    type: "searchset",
    total: 0,
    entry: [],
  };

  Object.entries(queryResponse).forEach(([_, resources]) => {
    if (Array.isArray(resources)) {
      resources.forEach((resource) => {
        bundle.entry?.push({ resource });
        bundle.total = (bundle.total || 0) + 1;
      });
    }
  });

  return bundle;
}

/**
 * Tests a connection to a FHIR server from the backend to avoid CORS issues
 * @param url - The URL of the FHIR server to test
 * @param bearerToken - Optional bearer token for authentication
 * @returns Object indicating success/failure and any error messages
 */
export async function testFhirServerConnection(
  url: string,
  bearerToken?: string,
) {
  try {
    const baseUrl = url.replace(/\/$/, "");
    const searchParams = new URLSearchParams({
      given: "Hyper",
      family: "Unlucky",
      birthdate: "1975-12-06",
      identifier: "8692756",
    });
    const patientSearchUrl = `${baseUrl}/Patient?${searchParams.toString()}`;

    const headers: HeadersInit = {
      Accept: "application/fhir+json",
    };

    if (bearerToken) {
      headers.Authorization = `Bearer ${bearerToken}`;
    }

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    try {
      const response = await fetch(patientSearchUrl, {
        method: "GET",
        headers,
        // @ts-ignore - Node's fetch types don't include agent, but it works
        agent: httpsAgent,
      });

      const responseText = await response.text(); // Get raw response text

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);

          if (data.resourceType === "Bundle" && data.type === "searchset") {
            return { success: true };
          } else {
            console.log(
              "Invalid response structure. Expected Bundle/searchset, got:",
              {
                resourceType: data.resourceType,
                type: data.type,
              },
            );
            return {
              success: false,
              error:
                "Invalid FHIR server response: Server did not return a valid search Bundle",
            };
          }
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          return {
            success: false,
            error: "Failed to parse server response as JSON",
          };
        }
      } else {
        let errorMessage: string;
        switch (response.status) {
          case 401:
            errorMessage =
              "Connection failed: Authentication required. Please check your credentials.";
            break;
          case 403:
            errorMessage =
              "Connection failed: Access forbidden. You do not have permission to access this FHIR server.";
            break;
          case 404:
            errorMessage =
              "Connection failed: The FHIR server endpoint was not found. Please verify the URL.";
            break;
          case 408:
            errorMessage =
              "Connection failed: The request timed out. The FHIR server took too long to respond.";
            break;
          case 500:
            errorMessage =
              "Connection failed: Internal server error. The FHIR server encountered an unexpected condition.";
            break;
          case 502:
            errorMessage =
              "Connection failed: Bad gateway. The FHIR server received an invalid response from upstream.";
            break;
          case 503:
            errorMessage =
              "Connection failed: The FHIR server is temporarily unavailable or under maintenance.";
            break;
          case 504:
            errorMessage =
              "Connection failed: Gateway timeout. The upstream server did not respond in time.";
            break;
          default:
            errorMessage = `Connection failed: The FHIR server returned an error. (${response.status} ${response.statusText})`;
        }
        return { success: false, error: errorMessage };
      }
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      throw fetchError; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error("Overall error in testFhirServerConnection:", error);
    return {
      success: false,
      error:
        "Connection failed: Unable to reach the FHIR server. Please check if the URL is correct and the server is accessible.",
    };
  }
}

class QueryService {
  private static fhirServerConfigs: FhirServerConfig[] = [];

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
    const fhirClient = await QueryService.prepareFhirClient(
      request.fhir_server,
    );

    const savedQuery = await getSavedQueryByName(request.query_name as string);

    if (!savedQuery) {
      throw new Error(`Unable to query of name ${request?.query_name}`);
    }
    const includeImmunization = savedQuery.immunization;
    const queryData = valueSetOverrides
      ? reconcileSavedQueryDataWithOverrides(
          savedQuery.query_data,
          valueSetOverrides,
        )
      : savedQuery.query_data;

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
      const queryResponse = await QueryService.parseFhirSearch(response);
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
  @auditable
  static async patientDiscoveryQuery(
    request: PatientDiscoveryRequest,
  ): Promise<QueryResponse["Patient"]> {
    const fhirClient = await QueryService.prepareFhirClient(
      request.fhir_server,
    );

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
        `Patient search failed. Status: ${fhirResponse.status} \n Body: ${await fhirResponse.text()} \n Headers: ${JSON.stringify(
          Object.fromEntries(fhirResponse.headers.entries()),
        )}`,
      );
    }
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
      patient_id: patient[0].id as string,
      ...queryRequest,
    });
    return {
      Patient: patient,
      ...patientRecords,
    };
  }

  /**
   * Helper function that creates a FHIR client for followup queries
   * @param fhirServer - the name of the FHIR server to query against
   * @returns a FHIR client to make queries against
   */
  static async prepareFhirClient(fhirServer: string) {
    if (QueryService.fhirServerConfigs.length === 0) {
      QueryService.fhirServerConfigs = await getFhirServerConfigs(false);
    }

    return new FHIRClient(fhirServer, this.fhirServerConfigs);
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
