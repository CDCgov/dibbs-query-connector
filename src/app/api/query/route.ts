import { NextRequest, NextResponse } from "next/server";
import {
  handleAndReturnError,
  handleRequestError,
} from "./error-handling-service";
import { fullPatientQuery } from "../../backend/query-execution";
import {
  RESPONSE_BODY_IS_NOT_PATIENT_RESOURCE,
  MISSING_PATIENT_IDENTIFIERS,
  MISSING_API_QUERY_PARAM,
  INVALID_FHIR_SERVERS,
  INVALID_QUERY,
  INVALID_MESSAGE_FORMAT,
} from "@/app/shared/constants";
import {
  mapDeprecatedUseCaseToId,
  parseHL7FromRequestBody,
  parsePatientDemographics,
} from "./parsers";
import { Message } from "node-hl7-client";
import { Bundle } from "fhir/r4";
import {
  FullPatientRequest,
  APIQueryResponse,
  QueryResponse,
} from "@/app/models/entities/query";
import { getFhirServerNames } from "@/app/backend/fhir-servers";
import { getSavedQueryById } from "@/app/backend/query-building/service";

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
  const street1 = params.get("street1") ?? "";
  const street2 = params.get("street2") ?? "";
  const city = params.get("city") ?? "";
  const state = params.get("state") ?? "";
  const zip = params.get("zip") ?? "";

  const noParamsDefined = [
    given,
    family,
    dob,
    mrn,
    phone,
    street1,
    street2,
    city,
    state,
    zip,
  ].every((e) => e === "");

  if (noParamsDefined) {
    const OperationOutcome = await handleRequestError(
      MISSING_PATIENT_IDENTIFIERS,
    );
    return NextResponse.json(OperationOutcome, { status: 400 });
  }

  // Add params & patient identifiers to QueryName
  const QueryRequest: FullPatientRequest = {
    queryName: queryResults.queryName,
    fhirServer: fhir_server,
    firstName: given,
    lastName: family,
    dob,
    mrn,
    phone,
    street1,
    street2,
    city,
    state,
    zip,
  };

  const QueryResponse: QueryResponse = await fullPatientQuery(QueryRequest);

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

  let QueryRequest: FullPatientRequest;
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
      const street1 = parsedMessage.get("PID.11.1").toString() ?? "";
      const street2 = parsedMessage.get("PID.11.2").toString() ?? "";
      const city = parsedMessage.get("PID.11.3").toString() ?? "";
      const state = parsedMessage.get("PID.11.4").toString() ?? "";
      const zip = parsedMessage.get("PID.11.5").toString() ?? "";
      const phone = parsedMessage.get("NK1.5.1").toString() ?? "";
      const noPatientIdentifierDefined = [
        firstName,
        lastName,
        mrn,
        phone,
        dob,
        street1,
        street2,
        city,
        state,
        zip,
      ].every((e) => e === "");

      if (noPatientIdentifierDefined) {
        return await handleAndReturnError(MISSING_PATIENT_IDENTIFIERS, 400);
      }

      QueryRequest = {
        queryName: queryResults?.queryName,
        fhirServer: fhir_server,
        firstName,
        lastName,
        dob,
        mrn,
        street1,
        street2,
        city,
        state,
        zip,
        phone,
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
        queryName: queryResults.queryName,
        fhirServer: fhir_server,
        firstName: PatientIdentifiers?.first_name,
        lastName: PatientIdentifiers?.last_name,
        dob: PatientIdentifiers?.dob,
        mrn: PatientIdentifiers?.mrn,
        street1: PatientIdentifiers.street1,
        street2: PatientIdentifiers.street2,
        city: PatientIdentifiers.city,
        state: PatientIdentifiers.state,
        zip: PatientIdentifiers.zip,
        phone: PatientIdentifiers?.phone,
      };
    } catch (error: unknown) {
      return await handleAndReturnError(error);
    }
  }

  const QueryResponse: QueryResponse = await fullPatientQuery(QueryRequest);

  // Bundle data
  const bundle: APIQueryResponse = await createBundle(QueryResponse);

  return NextResponse.json(bundle, {
    status: 200,
  });
}

/**
 * Create a FHIR Bundle from the query response.
 * @param queryResponse - The response object to store the results.
 * @returns - The FHIR Bundle of queried data.
 */
async function createBundle(
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
