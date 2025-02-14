import { NextRequest, NextResponse } from "next/server";
import { handleRequestError } from "./error-handling-service";
import {
  makeFhirQuery,
  QueryRequest,
  QueryResponse,
  createBundle,
  APIQueryResponse,
} from "../../shared/query-service";
import { getSavedQueryById } from "@/app/backend/query-building";
import {
  RESPONSE_BODY_IS_NOT_PATIENT_RESOURCE,
  MISSING_PATIENT_IDENTIFIERS,
  MISSING_API_QUERY_PARAM,
  INVALID_FHIR_SERVERS,
  INVALID_QUERY,
  USE_CASE_DETAILS,
  USE_CASES,
} from "@/app/shared/constants";
import { getFhirServerNames } from "@/app/shared/database-service";
import { parsePatientDemographics } from "./fhir/parsers";

/**
 * @swagger
 * /api/query:
 *   get:
 *     description: Returns the health status of the API
 *     responses:
 *       200:
 *         description: Health check for Query Connector
 * @returns An indication for the health of the API
 */
export async function GET() {
  return NextResponse.json({ status: "OK" }, { status: 200 });
}

/**
 * @swagger
 * /api/query:
 *   post:
 *     description: Handles a POST request to query a given FHIR server for a given query. The id and fhir_server are provided as query parameters in the request URL. The request body contains the FHIR patient resource to be queried.
 *     parameters:
 *       - name: fhir_server
 *         in: query
 *         description: Name of the FHIR server to query
 *         required: true
 *         schema:
 *           type: string
 *       - name: id
 *         in: query
 *         description: ID of the query to use
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               given:
 *                 type: string
 *                 description: Patient given name
 *               family:
 *                 type: string
 *                 description: Patient family name
 *               dob:
 *                 type: string
 *                 description: Patient date of birth
 *               mrn:
 *                 type: string
 *                 description: Patient Medical Record number
 *               phone:
 *                 type: string
 *                 description: Patient phone number
 *               resourceType:
 *                 type: string
 *                 description: The FHIR resource type
 *             example:
 *               given: "Lee"
 *               family: "Shaw"
 *               dob: "1975-12-06"
 *               resourceType: "Patient"
 *     responses:
 *       200:
 *         description: The FHIR resources returned that match the information configured in the query referenced
 *       400:
 *         description: Missing patient identifiers
 *       500:
 *         description: Something went wrong :(
 * @returns Response with QueryResponse.
 */
export async function POST(request: NextRequest) {
  let requestBody;

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
    console.error(error);
    if (error instanceof Error) {
      diagnostics_message = `${error.message}`;
    }
    const OperationOutcome = await handleRequestError(diagnostics_message);
    return NextResponse.json(OperationOutcome, { status: 500 });
  }

  // Extract id and fhir_server from nextUrl
  const params = request.nextUrl.searchParams;
  //deprecated, prefer id
  const use_case_param = params.get("use_case");
  const id_param = params.get("id");
  const fhir_server = params.get("fhir_server");
  const fhirServers = await getFhirServerNames();

  const id = id_param ? id_param : mapDeprecatedUseCaseToId(use_case_param);

  if (!id || !fhir_server || !requestBody) {
    const OperationOutcome = await handleRequestError(MISSING_API_QUERY_PARAM);
    return NextResponse.json(OperationOutcome, {
      status: 500,
    });
  } else if (!Object.values(fhirServers).includes(fhir_server)) {
    const OperationOutcome = await handleRequestError(INVALID_FHIR_SERVERS);
    return NextResponse.json(OperationOutcome, {
      status: 500,
    });
  }

  const queryResults = await getSavedQueryById(id);

  if (queryResults === undefined) {
    const OperationOutcome = await handleRequestError(INVALID_QUERY);
    return NextResponse.json(OperationOutcome, {
      status: 500,
    });
  }

  // try getting params straight from requestBody
  const given = requestBody["given"];
  const family = requestBody["family"];
  const dob = requestBody["dob"];
  const mrn = requestBody["mrn"];
  const phone = requestBody["phone"];
  const noParamsDefined = [given, family, dob, mrn, phone].every(
    (e) => e === undefined,
  );

  // Parse patient identifiers from a potential FHIR resource
  const PatientIdentifiers = await parsePatientDemographics(requestBody);

  if (Object.keys(PatientIdentifiers).length === 0 && noParamsDefined) {
    const OperationOutcome = await handleRequestError(
      MISSING_PATIENT_IDENTIFIERS,
    );
    return NextResponse.json(OperationOutcome, { status: 400 });
  }

  // Add params & patient identifiers to QueryName
  const QueryRequest: QueryRequest = {
    query_name: queryResults.query_name,
    fhir_server: fhir_server,
    first_name: PatientIdentifiers?.first_name ?? given,
    last_name: PatientIdentifiers?.last_name ?? family,
    dob: PatientIdentifiers?.dob ?? dob,
    mrn: PatientIdentifiers?.mrn ?? mrn,
    phone: PatientIdentifiers?.phone ?? phone,
  };

  const QueryResponse: QueryResponse = await makeFhirQuery(QueryRequest);

  // Bundle data
  const bundle: APIQueryResponse = await createBundle(QueryResponse);

  return NextResponse.json(bundle, {
    status: 200,
  });
}

function mapDeprecatedUseCaseToId(use_case: string | null) {
  if (use_case === null) return null;
  const potentialUseCaseMatch = USE_CASE_DETAILS[use_case as USE_CASES];
  const queryId = potentialUseCaseMatch?.id ?? null;
  return queryId;
}
