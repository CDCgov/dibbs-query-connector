import { Bundle, BundleEntry, Patient } from "fhir/r4";
import { GET, POST } from "../../api/query/route";
import { readJsonFile } from "../shared_utils/readJsonFile";
import {
  INVALID_FHIR_SERVERS,
  MISSING_API_QUERY_PARAM,
  MISSING_PATIENT_IDENTIFIERS,
  RESPONSE_BODY_IS_NOT_PATIENT_RESOURCE,
} from "@/app/constants";
import { NextRequest } from "next/server";

// Utility function to create a minimal NextRequest-like object
function createNextRequest(
  body: unknown,
  searchParams: URLSearchParams,
): NextRequest {
  return {
    json: async () => body,
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
  it("should return an OperationOutcome if the request body is not a Patient resource", async () => {
    const request = createNextRequest(
      { resourceType: "Observation" },
      new URLSearchParams(),
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
      new URLSearchParams(),
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(MISSING_PATIENT_IDENTIFIERS);
  });

  it("should return an OperationOutcome if the use_case or fhir_server is missing", async () => {
    const request = createNextRequest(PatientResource, new URLSearchParams());
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(MISSING_API_QUERY_PARAM);
  });

  it("should return an OperationOutcome if the fhir_server is not valid", async () => {
    const request = createNextRequest(
      PatientResource,
      new URLSearchParams("use_case=syphilis&fhir_server=invalid"),
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(INVALID_FHIR_SERVERS);
  });
  // Delete this test once we've messaged out the deprecation of use_case and
  // partners have switched over to using query_name
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
        "query_name=Syphilis%20case%20investigation&fhir_server=HELIOS Meld: Direct",
      ),
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("Bundle");
  });
});
