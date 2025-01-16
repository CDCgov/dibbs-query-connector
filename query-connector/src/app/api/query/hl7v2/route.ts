import { NextResponse, NextRequest } from "next/server";
import {
  UseCaseQuery,
  UseCaseQueryRequest,
  QueryResponse,
  createBundle,
  APIQueryResponse,
} from "../../../query-service";
import {
  USE_CASES,
  USE_CASE_DETAILS,
  INVALID_FHIR_SERVERS,
  INVALID_USE_CASE,
  MISSING_API_QUERY_PARAM,
  MISSING_PATIENT_IDENTIFIERS,
} from "../../../constants";

import { handleRequestError } from "../error-handling-service";
import {
  getFhirServerNames,
  getSavedQueryByName,
} from "@/app/database-service";
import { unnestValueSetsFromQuery } from "@/app/utils";
import { Message } from "node-hl7-client";

/**
 * Runs a query for a given use case and FHIR server. Patient demographics are provided
 * in the request body as a raw text HL7v2 message. The use_case and fhir_server are
 * provided
 * @param request - The incoming Next.js request object.
 * @returns Response with UseCaseResponse.
 */
export async function POST(request: NextRequest) {
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

  const rawMessage = await request.text();
  const parsedMessage = new Message({ text: rawMessage });

  // Add params & patient identifiers to UseCaseRequest
  const UseCaseRequest: UseCaseQueryRequest = {
    use_case: use_case as USE_CASES,
    fhir_server: fhir_server,
    first_name: parsedMessage.get("PID.5.2").toString() || "",
    last_name: parsedMessage.get("PID.5.1").toString() || "",
  };

  if (
    !UseCaseRequest.first_name &&
    !UseCaseRequest.last_name &&
    !UseCaseRequest.dob
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
