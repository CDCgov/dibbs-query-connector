import { NextRequest, NextResponse } from "next/server";
import {
  handleAndReturnError,
  handleRequestError,
} from "./error-handling-service";
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
  INVALID_MESSAGE_FORMAT,
} from "@/app/shared/constants";
import { getFhirServerNames } from "@/app/shared/database-service";
import {
  mapDeprecatedUseCaseToId,
  parseHL7FromRequestBody,
  parsePatientDemographics,
} from "./parsers";
import { Message } from "node-hl7-client";

/**
 * @param request - A GET request as described by the Swagger docs
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
 * @param request A POST request as described by the Swagger docs
 * @swagger
 * /api/query:
 *   post:
 *     description: A POST endpoint that accepts a FHIR patient resource or an HL7v2 message in the request body to execute a query within the Query Connector
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
 *       - name: message_format
 *         in: query
 *         description: Whether the request body contents are HL7 or FHIR formatted messages
 *         schema:
 *           type: string
 *           enum: [HL7, FHIR]
 *           example: FHIR
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
  // Extract id and fhir_server from nextUrl
  const params = request.nextUrl.searchParams;
  //deprecated, prefer id
  const use_case_param = params.get("use_case");
  const id_param = params.get("id");
  const fhir_server = params.get("fhir_server");
  const fhirServers = await getFhirServerNames();

  const id = id_param ? id_param : mapDeprecatedUseCaseToId(use_case_param);

  if (!id || !fhir_server) {
    return await handleAndReturnError(MISSING_API_QUERY_PARAM);
  } else if (!Object.values(fhirServers).includes(fhir_server)) {
    return await handleAndReturnError(INVALID_FHIR_SERVERS);
  }

  const queryResults = await getSavedQueryById(id);
  if (queryResults === undefined) {
    return handleAndReturnError(INVALID_QUERY);
  }

  // check message format of body, default to FHIR
  const messageFormat = params.get("message_format") ?? "FHIR";
  if (messageFormat !== "FHIR" && messageFormat !== "HL7") {
    return await handleAndReturnError(INVALID_MESSAGE_FORMAT);
  }

  let QueryRequest: QueryRequest;
  if (messageFormat === "HL7") {
    try {
      let requestText = await request.text();

      const parsedMessage = new Message({
        text: parseHL7FromRequestBody(requestText),
      });

      console.log(
        parsedMessage.get("PID.3.1").toString(),
        parsedMessage.get("NK1.5.1").toString(),
      );
      QueryRequest = {
        query_name: queryResults?.query_name,
        fhir_server: fhir_server,
        first_name: parsedMessage.get("PID.5.2").toString() || "",
        last_name: parsedMessage.get("PID.5.1").toString() || "",
        dob: parsedMessage.get("PID.7.1").toString() || "",
        mrn: parsedMessage.get("PID.3.1").toString() || "",
        phone: parsedMessage.get("NK1.5.1").toString() || "",
      };
    } catch (error: unknown) {
      return await handleAndReturnError(error);
    }
  } else {
    try {
      const requestBodyToCheck = await request.json();
      // try extracting patient identifiers out of the request body from a potential
      // FHIR message or as raw params
      if (
        requestBodyToCheck.resourceType &&
        requestBodyToCheck.resourceType !== "Patient"
      ) {
        return await handleAndReturnError(
          RESPONSE_BODY_IS_NOT_PATIENT_RESOURCE,
        );
      }

      // Parse patient identifiers from a potential FHIR resource
      const PatientIdentifiers = parsePatientDemographics(requestBodyToCheck);

      if (Object.keys(PatientIdentifiers).length === 0) {
        return await handleAndReturnError(MISSING_PATIENT_IDENTIFIERS, 400);
      }

      // Add params & patient identifiers to QueryName
      QueryRequest = {
        query_name: queryResults.query_name,
        fhir_server: fhir_server,
        first_name: PatientIdentifiers?.first_name,
        last_name: PatientIdentifiers?.last_name,
        dob: PatientIdentifiers?.dob,
        mrn: PatientIdentifiers?.mrn,
        phone: PatientIdentifiers?.phone,
      };
    } catch (error: unknown) {
      return await handleAndReturnError(error);
    }
  }

  const QueryResponse: QueryResponse = await makeFhirQuery(QueryRequest);

  // Bundle data
  const bundle: APIQueryResponse = await createBundle(QueryResponse);

  return NextResponse.json(bundle, {
    status: 200,
  });
}
