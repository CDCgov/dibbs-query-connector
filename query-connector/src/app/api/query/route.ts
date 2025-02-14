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
 *     description: A GET endpoint that accepts a series of query parameters to execute a query within the Query Connector.
 *     parameters:
 *       - name: fhir_server
 *         in: query
 *         description: Name of the FHIR server to query
 *         required: true
 *         schema:
 *           type: string
 *           example: "HELIOS Meld: Direct"
 *       - name: id
 *         in: query
 *         description: ID of the query to use
 *         required: true
 *         schema:
 *           type: string
 *           example: cf580d8d-cc7b-4eae-8a0d-96c36f9222e3
 *       - name: given
 *         type: string
 *         in: query
 *         description: Patient given name
 *         schema:
 *           type: string
 *           example: Lee
 *       - name: family
 *         in: query
 *         description: Patient family name
 *         schema:
 *           type: string
 *           example: Shaw
 *       - name: dob
 *         in: query
 *         description: Patient date of birth in YYYY-MM-DD format
 *         schema:
 *           type: string
 *           example: 1975-12-06
 *       - name: mrn
 *         in: query
 *         description: Patient medical record number
 *         schema:
 *           type: string
 *           example: 8692756
 *       - name: phone
 *         in: query
 *         description: Patient phone number
 *         schema:
 *           type: string
 *           example: 517-425-1398
 *     responses:
 *       200:
 *         description: The FHIR resources returned that match the information configured in the query referenced
 *       400:
 *         description: Missing patient identifiers
 *       500:
 *         description: Something went wrong :(
 * @returns Response with QueryResponse.
 */
export async function GET(request: NextRequest) {
  // Extract id and fhir_server from nextUrl
  const params = request.nextUrl.searchParams;
  //deprecated, prefer id
  const use_case_param = params.get("use_case");
  const id_param = params.get("id");
  const fhir_server = params.get("fhir_server");
  const fhirServers = await getFhirServerNames();

  const id = id_param ? id_param : mapDeprecatedUseCaseToId(use_case_param);

  if (!id || !fhir_server) {
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
  const given = params.get("given") ?? "";
  const family = params.get("family") ?? "";
  const dob = params.get("dob") ?? "";
  const mrn = params.get("mrn") ?? "";
  const phone = params.get("phone") ?? "";
  const noParamsDefined = [given, family, dob, mrn, phone].every(
    (e) => e === "",
  );

  if (noParamsDefined) {
    const OperationOutcome = await handleRequestError(
      MISSING_PATIENT_IDENTIFIERS,
    );
    return NextResponse.json(OperationOutcome, { status: 400 });
  }

  // Add params & patient identifiers to QueryName
  const QueryRequest: QueryRequest = {
    query_name: queryResults.query_name,
    fhir_server: fhir_server,
    first_name: given,
    last_name: family,
    dob: dob,
    mrn: mrn,
    phone: phone,
  };

  const QueryResponse: QueryResponse = await makeFhirQuery(QueryRequest);

  // Bundle data
  const bundle: APIQueryResponse = await createBundle(QueryResponse);

  return NextResponse.json(bundle, {
    status: 200,
  });
}

/**
 * @swagger
 * /api/query:
 *   post:
 *     description: A POST endpoint that accepts a FHIR patient resource in the request body to execute a query within the Query Connector
 *     parameters:
 *       - name: fhir_server
 *         in: query
 *         description: Name of the FHIR server to query
 *         required: true
 *         schema:
 *           type: string
 *           example: "HELIOS Meld: Direct"
 *       - name: id
 *         in: query
 *         description: ID of the query to use
 *         required: true
 *         schema:
 *           type: string
 *           example: cf580d8d-cc7b-4eae-8a0d-96c36f9222e3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *           example: { "resourceType": "Patient", "id": "1C", "meta": { "versionId": "1", "lastUpdated": "2024-01-16T15:08:24.000+00:00", "source": "#Aolu2ZnQyoelPvRd", "profile": [ "http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient" ] }, "text": { "status": "generated", "div": "<div xmlns=\"http://www.w3.org/1999/xhtml\">This is a simple narrative with only plain text</div>" }, "extension": [ { "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race", "extension": [ { "url": "ombCategory", "valueCoding": { "system": "urn:oid:2.16.840.1.113883.6.238", "code": "2106-3", "display": "White" } }, { "url": "text", "valueString": "Mixed" } ] }, { "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity", "extension": [ { "url": "ombCategory", "valueCoding": { "system": "urn:oid:2.16.840.1.113883.6.238", "code": "2135-2", "display": "Hispanic or Latino" } }, { "url": "text", "valueString": "Hispanic or Latino" } ] } ], "identifier": [ { "use": "usual", "type": { "coding": [ { "system": "http://terminology.hl7.org/CodeSystem/v2-0203", "code": "MR", "display": "Medical Record Number" } ], "text": "Medical Record Number" }, "system": "http://hospital.smarthealthit.org", "value": "8692756" } ], "active": true, "name": [ { "family": "Shaw", "given": [ "Lee", "A." ], "period": { "start": "1975-12-06", "end": "2020-01-22" } }, { "family": "Shaw", "given": [ "Lee", "V." ], "suffix": [ "MD" ], "period": { "start": "2020-01-23" } } ], "telecom": [ { "system": "phone", "value": "517-425-1398", "use": "home" }, { "system": "email", "value": "lee.shaw@email.com" } ], "gender": "male", "birthDate": "1975-12-06", "address": [ { "line": [ "49 Meadow St" ], "city": "Lansing", "state": "MI", "postalCode": "48864", "country": "US", "period": { "start": "2016-12-06", "end": "2020-07-22" } }, { "line": [ "183 Mountain View St" ], "city": "Lansing", "state": "MI", "postalCode": "48901", "country": "US", "period": { "start": "2020-07-22" } } ] }
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
