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

      const firstName = parsedMessage.get("PID.5.2").toString() ?? "";
      const lastName = parsedMessage.get("PID.5.1").toString() ?? "";
      const dob = parsedMessage.get("PID.7.1").toString() ?? "";
      const mrn = parsedMessage.get("PID.3.1").toString() ?? "";
      const phone = parsedMessage.get("NK1.5.1").toString() ?? "";
      const noPatientIdentifierDefined = [
        firstName,
        lastName,
        mrn,
        phone,
        dob,
      ].every((e) => e === "");
      console.log(firstName, lastName, mrn, phone, dob);

      if (noPatientIdentifierDefined) {
        return await handleAndReturnError(MISSING_PATIENT_IDENTIFIERS, 400);
      }

      QueryRequest = {
        query_name: queryResults?.query_name,
        fhir_server: fhir_server,
        first_name: firstName,
        last_name: lastName,
        dob: dob,
        mrn: mrn,
        phone: phone,
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
