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
  USE_CASES,
  USE_CASE_DETAILS,
  INVALID_FHIR_SERVERS,
  INVALID_USE_CASE,
  RESPONSE_BODY_IS_NOT_PATIENT_RESOURCE,
  MISSING_API_QUERY_PARAM,
  MISSING_PATIENT_IDENTIFIERS,
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
  const use_case = params.get("use_case");
  const fhir_server = params.get("fhir_server");
  const fhirServers = await getFhirServerNames();

  if (!use_case || !fhir_server) {
    const OperationOutcome = await handleRequestError(MISSING_API_QUERY_PARAM);
    return NextResponse.json(OperationOutcome);
  } else if (!Object.keys(USE_CASE_DETAILS).includes(use_case)) {
    const OperationOutcome = await handleRequestError(INVALID_USE_CASE);
    return NextResponse.json(OperationOutcome);
  } else if (!Object.values(fhirServers).includes(fhir_server)) {
    const OperationOutcome = await handleRequestError(INVALID_FHIR_SERVERS);
    return NextResponse.json(OperationOutcome);
  }

  // Lookup default parameters for particular use-case search
  const queryName = USE_CASE_DETAILS[use_case as USE_CASES].queryName;
  const queryResults = await getSavedQueryByName(queryName);
  const valueSets = unnestValueSetsFromQuery(queryResults);

  // Add params & patient identifiers to QueryName
  const QueryRequest: QueryRequest = {
    query_name: use_case as USE_CASES,
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

  const QueryResponse: QueryResponse = await makeFhirQuery(QueryRequest);

  // Bundle data
  const bundle: APIQueryResponse = await createBundle(QueryResponse);

  return NextResponse.json(bundle);
}
