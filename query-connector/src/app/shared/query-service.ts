"use server";
import fetch from "node-fetch";
import https from "https";
import { Bundle, FhirResource } from "fhir/r4";

import FHIRClient from "./fhir-servers";
import { DibbsValueSet, isFhirResource } from "../shared/constants";

import { CustomQuery } from "./CustomQuery";
import { GetPhoneQueryFormats } from "./format-service";
import { getFhirServerConfigs, getSavedQueryByName } from "./database-service";
import { QueryDataColumn } from "../(pages)/queryBuilding/utils";

/**
 * The query response when the request source is from the Viewer UI.
 */
export type QueryResponse = {
  [R in FhirResource as R["resourceType"]]?: R[];
};

export type APIQueryResponse = Bundle;

export type QueryRequest = {
  query_name: string | null;
  just_return_patient?: boolean;
  fhir_server: string;
  first_name?: string;
  last_name?: string;
  dob?: string;
  mrn?: string;
  phone?: string;
};

// Expected responses from the FHIR server
export type FhirQueryResponse = Awaited<ReturnType<typeof makeFhirQuery>>;

/**
 * Query a FHIR server for a patient based on demographics provided in the request. If
 * a patient is found, store in the queryResponse object.
 * @param request - The request object containing the patient demographics.
 * @param fhirClient - The client to query the FHIR server.
 * @param runningQueryResponse - The response object to store the patient.
 * @returns - The response body from the FHIR server.
 */
async function patientQuery(
  request: QueryRequest,
  fhirClient: FHIRClient,
  runningQueryResponse: QueryResponse,
): Promise<QueryResponse> {
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
      `Patient search failed. Status: ${fhirResponse.status} \n Body: ${
        fhirResponse.text
      } \n Headers: ${JSON.stringify(fhirResponse.headers.raw())}`,
    );
  }
  const newResponse = await parseFhirSearch(fhirResponse, runningQueryResponse);
  return newResponse;
}

/**
 * Query a FHIR API for a public health use case based on patient demographics provided
 * in the request. If data is found, return in a queryResponse object.
 * @param request - QueryRequest object containing the patient demographics and query name.
 * @param queryResponse - The response object to store the query results.
 * @param valueSetOverrides - Overrides from the saved query state from customize
 * query
 * @returns - The response object containing the query results.
 */
export async function makeFhirQuery(
  request: QueryRequest,
  queryResponse: QueryResponse = {},
  valueSetOverrides: DibbsValueSet[] = [],
): Promise<QueryResponse> {
  const fhirServerConfigs = await getFhirServerConfigs();
  const fhirClient = new FHIRClient(request.fhir_server, fhirServerConfigs);
  const onePatientDefined = queryResponse.Patient && queryResponse.Patient[0];

  if (!onePatientDefined) {
    queryResponse = await patientQuery(request, fhirClient, queryResponse);
  }

  // indication that we only want the patient result from the FHIR query
  const justReturnPatient =
    request.query_name === null || request.just_return_patient;

  const noPatientToQueryWith =
    !queryResponse.Patient || queryResponse.Patient.length !== 1;

  if (justReturnPatient || noPatientToQueryWith) {
    return queryResponse;
  }

  if (!queryResponse.Patient?.[0]?.id) {
    throw new Error("Unable to retrieve valid patient ID");
  }

  const patientId = queryResponse.Patient[0].id;
  const savedQuery = await getSavedQueryByName(request.query_name as string);

  if (!savedQuery) {
    throw new Error(`Unable to query of name ${request?.query_name}`);
  }

  const queryToPost = reconcileSavedQueryDataWithOverrides(
    savedQuery.query_data,
    valueSetOverrides,
  );
  const fhirResponse = await postFhirQuery(
    queryToPost,
    patientId,
    fhirClient,
    queryResponse,
    savedQuery.query_name,
    savedQuery ? savedQuery.immunization : false,
  );

  return fhirResponse;
}

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
 * Performs a generalized query for collections of patients matching
 * particular criteria. The query is determined by a collection of passed-in
 * valuesets to include in the query results, and any patients found must
 * have eCR data interseecting with these valuesets.
 * @param queryData The saved JSON query in the query table that we need to
 * translate into a FHIR query
 * @param patientId The ID of the patient for whom to search.
 * @param fhirClient The client used to communicate with the FHIR server.
 * @param queryResponse The response object for the query results.
 * @param queryName Name of the query to send out to tthe FHIR server
 * @param includeImmunization Whether to include immunization in the query execution
 * @returns A promise for an updated query response.
 */
async function postFhirQuery(
  queryData: QueryDataColumn,
  patientId: string,
  fhirClient: FHIRClient,
  queryResponse: QueryResponse,
  queryName?: string,
  includeImmunization?: boolean,
): Promise<QueryResponse> {
  const builtQuery = new CustomQuery(queryData, patientId, includeImmunization);
  let response: fetch.Response | fetch.Response[];

  if (queryName?.includes("Immunization")) {
    const { basePath, params } = builtQuery.getQuery("immunization");
    response = await fhirClient.get([basePath, params].join(","));
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
    .filter((v): v is fetch.Response => !!v);

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
    .filter((v): v is fetch.Response => !!v);

  response = successfulResults;
  queryResponse = await parseFhirSearch(response, queryResponse);
  return queryResponse;
}

/**
 * Parse the response from a FHIR search query. If the response is successful and
 * contains data, return an array of parsed resources.
 * @param response - The response from the FHIR server.
 * @param queryResponse - The response object to store the results.
 * @returns - The parsed response.
 */
export async function parseFhirSearch(
  response: fetch.Response | Array<fetch.Response>,
  queryResponse: Record<string, FhirResource[]> = {},
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
  // Add resources to queryResponse
  for (const resource of resourceArray) {
    const resourceType = resource.resourceType;

    // Check if resourceType already exists in queryResponse & initialize if not
    if (!(resourceType in queryResponse)) {
      queryResponse[resourceType] = [];
    }
    // Check if the resourceID has already been seen & only added resources that haven't been seen before
    if (resource.id && !resourceIds.has(resource.id)) {
      queryResponse[resourceType]!.push(resource);
      resourceIds.add(resource.id);
    }
  }

  return queryResponse;
}

/**
 * Process the response from a FHIR search query. If the response is successful and
 * contains data, return an array of resources that are ready to be parsed.
 * @param response - The response from the FHIR server.
 * @returns - The array of resources from the response.
 */
export async function processFhirResponse(
  response: fetch.Response,
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
