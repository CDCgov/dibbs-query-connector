import {
  MISSING_API_QUERY_PARAM,
  INVALID_FHIR_SERVERS,
  MISSING_PATIENT_IDENTIFIERS,
  INVALID_QUERY,
} from "@/app/shared/constants";
import { getFhirServerNames } from "@/app/shared/database-service";
import {
  QueryResponse,
  APIQueryResponse,
  createBundle,
  makeFhirQuery,
  QueryRequest,
} from "@/app/shared/query-service";
import { NextRequest, NextResponse } from "next/server";
import { handleRequestError } from "../error-handling-service";
import { getSavedQueryById } from "@/app/backend/query-building";
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
  const id = params.get("id");
  const fhir_server = params.get("fhir_server");
  const fhirServers = await getFhirServerNames();

  if (!id || !fhir_server) {
    const OperationOutcome = await handleRequestError(MISSING_API_QUERY_PARAM);
    return NextResponse.json(OperationOutcome);
  } else if (!Object.values(fhirServers).includes(fhir_server)) {
    const OperationOutcome = await handleRequestError(INVALID_FHIR_SERVERS);
    return NextResponse.json(OperationOutcome);
  }

  // Lookup default parameters for particular use-case search
  const queryResults = await getSavedQueryById(id);

  if (queryResults === undefined) {
    const OperationOutcome = await handleRequestError(INVALID_QUERY);
    return NextResponse.json(OperationOutcome, {
      status: 500,
    });
  }

  const rawMessage = await request.text();
  const parsedMessage = new Message({ text: rawMessage });

  // Add params & patient identifiers to QueryRequest
  const queryRequest: QueryRequest = {
    query_name: queryResults?.query_name,
    fhir_server: fhir_server,
    first_name: parsedMessage.get("PID.5.2").toString() || "",
    last_name: parsedMessage.get("PID.5.1").toString() || "",
    dob: parsedMessage.get("PID.7.1").toString() || "",
  };

  if (
    !queryRequest.first_name &&
    !queryRequest.last_name &&
    !queryRequest.dob
  ) {
    const OperationOutcome = await handleRequestError(
      MISSING_PATIENT_IDENTIFIERS,
    );
    return NextResponse.json(OperationOutcome, { status: 400 });
  }

  const UseCaseQueryResponse: QueryResponse = await makeFhirQuery(queryRequest);

  // Bundle data
  const bundle: APIQueryResponse = await createBundle(UseCaseQueryResponse);

  return NextResponse.json(bundle);
}
