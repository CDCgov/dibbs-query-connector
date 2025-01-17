import { NextResponse, NextRequest } from "next/server";
import {
  makeFhirQuery,
  QueryRequest,
  QueryResponse,
  createBundle,
  APIQueryResponse,
} from "../../query-service";
import { parsePatientDemographics } from "./parsing-service";
import {
  INVALID_FHIR_SERVERS,
  INVALID_QUERY,
  RESPONSE_BODY_IS_NOT_PATIENT_RESOURCE,
  MISSING_API_QUERY_PARAM,
  MISSING_PATIENT_IDENTIFIERS,
  USE_CASE_DETAILS,
  USE_CASES,
} from "../../constants";

import { handleRequestError } from "./error-handling-service";
import {
  getFhirServerNames,
  getSavedQueryByName,
} from "@/app/database-service";
import { unnestValueSetsFromQuery } from "@/app/utils";

/**
 * Health check for TEFCA Viewer
 * @returns Response with status OK.
 */
export async function GET() {
  return NextResponse.json({ status: "OK" }, { status: 200 });
}

/**
 * Handles a POST request to query a given FHIR server for a given use case. The
 * use_case and fhir_server are provided as query parameters in the request URL. The
 * request body contains the FHIR patient resource to be queried.
 * @param request - The incoming Next.js request object.
 * @returns Response with UseCaseResponse.
 */
export async function POST(request: NextRequest) {
  let requestBody;
  let PatientIdentifiers;

  try {
    requestBody = await request.json();

    // Check if requestBody is a patient resource
    if (requestBody.resourceType !== "Patient") {
      const OperationOutcome = await handleRequestError(
        RESPONSE_BODY_IS_NOT_PATIENT_RESOURCE,
      );
      return NextResponse.json(OperationOutcome);
    }
  } catch (error: unknown) {
    let diagnostics_message = "An error occurred.";
    if (error instanceof Error) {
      diagnostics_message = `${error.message}`;
    }
    const OperationOutcome = await handleRequestError(diagnostics_message);
    return NextResponse.json(OperationOutcome);
  }

  // Parse patient identifiers from requestBody
  PatientIdentifiers = await parsePatientDemographics(requestBody);
  // Check if PatientIdentifiers is empty or there was an error parsing patient identifiers
  if (Object.keys(PatientIdentifiers).length === 0) {
    const OperationOutcome = await handleRequestError(
      MISSING_PATIENT_IDENTIFIERS,
    );
    return NextResponse.json(OperationOutcome);
  }

  // Extract use_case and fhir_server from nextUrl
  const params = request.nextUrl.searchParams;
  const use_case_param = params.get("use_case"); //deprecated, prefer query_name
  const query_name_param = params.get("query_name");
  const fhir_server = params.get("fhir_server");
  const fhirServers = await getFhirServerNames();

  const query_name = query_name_param
    ? query_name_param
    : mapDeprecatedUseCaseToQueryName(use_case_param);

  if (!query_name || !fhir_server) {
    const OperationOutcome = await handleRequestError(MISSING_API_QUERY_PARAM);
    return NextResponse.json(OperationOutcome);
  } else if (!Object.values(fhirServers).includes(fhir_server)) {
    const OperationOutcome = await handleRequestError(INVALID_FHIR_SERVERS);
    return NextResponse.json(OperationOutcome);
  }

  // Add params & patient identifiers to QueryName
  const QueryRequest: QueryRequest = {
    query_name: query_name,
    fhir_server: fhir_server,
    ...(PatientIdentifiers.first_name && {
      first_name: PatientIdentifiers.first_name,
    }),
    ...(PatientIdentifiers.last_name && {
      last_name: PatientIdentifiers.last_name,
    }),
    ...(PatientIdentifiers.dob && { dob: PatientIdentifiers.dob }),
    ...(PatientIdentifiers.mrn && { mrn: PatientIdentifiers.mrn }),
    ...(PatientIdentifiers.phone && { phone: PatientIdentifiers.phone }),
  };

  const queryResults = await getSavedQueryByName(query_name);

  if (queryResults.length === 0) {
    const OperationOutcome = await handleRequestError(INVALID_QUERY);
    return NextResponse.json(OperationOutcome);
  }

  const valueSets = unnestValueSetsFromQuery(queryResults);

  const QueryResponse: QueryResponse = await makeFhirQuery(
    QueryRequest,
    valueSets,
  );

  // Bundle data
  const bundle: APIQueryResponse = await createBundle(QueryResponse);

  return NextResponse.json(bundle);
}

function mapDeprecatedUseCaseToQueryName(use_case: string | null) {
  if (use_case === null) return null;
  const potentialUseCaseMatch = USE_CASE_DETAILS[use_case as USE_CASES];
  const queryName = potentialUseCaseMatch?.queryName ?? null;
  return queryName;
}
