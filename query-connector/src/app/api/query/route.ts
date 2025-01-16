import { NextRequest, NextResponse } from "next/server";
import { handleRequestError } from "./error-handling-service";
import {
  USE_CASES,
  USE_CASE_DETAILS,
  INVALID_FHIR_SERVERS,
  INVALID_USE_CASE,
  MISSING_API_QUERY_PARAM,
  MISSING_PATIENT_IDENTIFIERS,
} from "../../constants";
import {
  getFhirServerNames,
  getSavedQueryByName,
} from "@/app/database-service";
import { unnestValueSetsFromQuery } from "@/app/utils";
import {
  UseCaseQuery,
  UseCaseQueryRequest,
  QueryResponse,
  createBundle,
  APIQueryResponse,
} from "../../query-service";

/**
 * Handles a GET request to query a given FHIR server for a given use case. The use_case
 * fhir_server and patient demographics are provided as query parameters in the request
 * URL.
 * @param request - The incoming Next.js request object.
 * @returns Response with UseCaseResponse.
 */
export async function GET(request: NextRequest) {
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

  // Add params & patient identifiers to UseCaseRequest
  const UseCaseRequest: UseCaseQueryRequest = {
    use_case: use_case as USE_CASES,
    fhir_server: fhir_server,
    first_name: params.get("given") || "",
    last_name: params.get("family") || "",
    dob: params.get("dob") || "",
    mrn: params.get("mrn") || "",
    phone: params.get("phone") || "",
  };

  if (
    !UseCaseRequest.first_name &&
    !UseCaseRequest.last_name &&
    !UseCaseRequest.dob &&
    !UseCaseRequest.mrn &&
    !UseCaseRequest.phone
  ) {
    const OperationOutcome = await handleRequestError(
      MISSING_PATIENT_IDENTIFIERS,
    );
    return NextResponse.json(OperationOutcome, { status: 400 });
  }

  const UseCaseQueryResponse: QueryResponse = await UseCaseQuery(
    UseCaseRequest,
    valueSets,
  );

  // Bundle data
  const bundle: APIQueryResponse = await createBundle(UseCaseQueryResponse);

  return NextResponse.json(bundle);
}
