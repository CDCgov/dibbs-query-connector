import { Bundle, BundleEntry, Patient } from "fhir/r4";
import { readJsonFile } from "../shared_utils/readJsonFile";
import {
  INVALID_FHIR_SERVERS,
  INVALID_MESSAGE_FORMAT,
  MISSING_API_QUERY_PARAM,
  MISSING_PATIENT_IDENTIFIERS,
  RESPONSE_BODY_IS_NOT_PATIENT_RESOURCE,
  USE_CASE_DETAILS,
} from "@/app/shared/constants";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/query/route";
import { GET } from "@/app/api/route";
import { PATIENT_HL7_MESSAGE } from "./fixtures";

// Utility function to create a minimal NextRequest-like object
function createNextRequest(
  body: unknown,
  searchParams: URLSearchParams,
): NextRequest {
  return {
    json: async () => body,
    text: async () => body,
    nextUrl: { searchParams },
    method: "POST",
    headers: new Headers(),
  } as unknown as NextRequest;
}

const PatientBundle = readJsonFile("./src/app/tests/assets/BundlePatient.json");
const PatientResource: Patient | undefined = (
  (PatientBundle as Bundle).entry as BundleEntry[]
)[0]?.resource as Patient;

if (!PatientResource || PatientResource.resourceType !== "Patient") {
  throw new Error("Invalid Patient resource in the test bundle.");
}

describe("GET Health Check", () => {
  it("should return status OK", async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe("OK");
  });
});

describe("POST Query FHIR Server", () => {
  // let warn;
  // beforeEach(() => {
  //   // supress the console warns for the error endpoints
  //   // warn = jest.spyOn(console, "error").mockImplementation(() => {});
  // });

  // afterEach(() => {
  //   warn.mockRestore();
  // });

  const SYPHILIS_QUERY_ID = USE_CASE_DETAILS.syphilis.id;
  it("should return an OperationOutcome if the request body is not a Patient resource", async () => {
    const request = createNextRequest(
      { resourceType: "Observation" },
      new URLSearchParams(
        `id=${SYPHILIS_QUERY_ID}&fhir_server=HELIOS Meld: Direct`,
      ),
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(
      RESPONSE_BODY_IS_NOT_PATIENT_RESOURCE,
    );
  });

  it("should return an OperationOutcome if there are no patient identifiers to parse from the request body", async () => {
    const request = createNextRequest(
      { resourceType: "Patient" },
      new URLSearchParams(
        `id=${SYPHILIS_QUERY_ID}&fhir_server=HELIOS Meld: Direct`,
      ),
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(MISSING_PATIENT_IDENTIFIERS);
  });

  it("should return an OperationOutcome if the id or fhir_server is missing", async () => {
    const request = createNextRequest(PatientResource, new URLSearchParams());
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(MISSING_API_QUERY_PARAM);
  });

  it("should return an OperationOutcome if the fhir_server is not valid", async () => {
    const request = createNextRequest(
      PatientResource,
      new URLSearchParams(`id=${SYPHILIS_QUERY_ID}&fhir_server=invalid`),
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(INVALID_FHIR_SERVERS);
  });
  it("should return an OperationOutcome if the message type is not valid", async () => {
    const request = createNextRequest(
      PatientResource,
      new URLSearchParams(
        "use_case=syphilis&fhir_server=HELIOS Meld: Direct&message_format=invalid",
      ),
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(INVALID_MESSAGE_FORMAT);
  });
  // Delete this test once we've messaged out the deprecation of use_case and
  // partners have switched over to using id
  it("should return a legitimate FHIR bundle if it uses the deprecated use_case param", async () => {
    const request = createNextRequest(
      PatientResource,
      new URLSearchParams("use_case=syphilis&fhir_server=HELIOS Meld: Direct"),
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("Bundle");
  });
  it("should return a legitimate FHIR bundle if the query is successful", async () => {
    const request = createNextRequest(
      PatientResource,
      new URLSearchParams(
        `id=${SYPHILIS_QUERY_ID}&fhir_server=HELIOS Meld: Direct`,
      ),
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("Bundle");

    // should also work if FHIR format type is explicitly specified
    const explicitFhirRequest = createNextRequest(
      PatientResource,
      new URLSearchParams(
        `id=${SYPHILIS_QUERY_ID}&fhir_server=HELIOS Meld: Direct&message_format=FHIR`,
      ),
    );
    const explicitFhirResponse = await POST(explicitFhirRequest);
    const explicitFhirBody = await explicitFhirResponse.json();
    expect(explicitFhirBody.resourceType).toBe("Bundle");
  });
  it("should return a FHIR bundle if HL7 message is provided in the query body", async () => {
    const request = createNextRequest(
      PATIENT_HL7_MESSAGE,
      new URLSearchParams(
        `id=${SYPHILIS_QUERY_ID}&fhir_server=HELIOS Meld: Direct&message_format=HL7`,
      ),
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("Bundle");
  });
});
