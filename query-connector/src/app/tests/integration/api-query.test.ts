/**
 * @jest-environment node
 */

import { Bundle, BundleEntry } from "fhir/r4";
import { GET, POST } from "../../api/query/route";
import { readJsonFile } from "../shared_utils/readJsonFile";
import {
  INVALID_FHIR_SERVERS,
  INVALID_USE_CASE,
  MISSING_API_QUERY_PARAM,
  MISSING_PATIENT_IDENTIFIERS,
  RESPONSE_BODY_IS_NOT_PATIENT_RESOURCE,
} from "@/app/constants";

const PatientBundle = readJsonFile("./src/app/tests/assets/BundlePatient.json");
const PatientResource = ((PatientBundle as Bundle).entry as BundleEntry[])[0]
  .resource;

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
    const request = {
      json: async () => {
        return { resourceType: "Observation" };
      },
    };
    const response = await POST(request as any);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(
      RESPONSE_BODY_IS_NOT_PATIENT_RESOURCE,
    );
  });

  it("should return an OperationOutcome if there are no patient identifiers to parse from the request body", async () => {
    const request = {
      json: async () => {
        return { resourceType: "Patient" };
      },
    };
    const response = await POST(request as any);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(MISSING_PATIENT_IDENTIFIERS);
  });

  it("should return an OperationOutcome if the use_case or fhir_server is missing", async () => {
    const request = {
      json: async () => {
        return PatientResource;
      },
      nextUrl: {
        searchParams: new URLSearchParams(),
      },
    };
    const response = await POST(request as any);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(MISSING_API_QUERY_PARAM);
  });

  it("should return an OperationOutcome if the use_case is not valid", async () => {
    const request = {
      json: async () => {
        return PatientResource;
      },
      nextUrl: {
        searchParams: new URLSearchParams(
          "use_case=invalid&fhir_server=HELIOS Meld: Direct",
        ),
      },
    };
    const response = await POST(request as any);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(INVALID_USE_CASE);
  });

  it("should return an OperationOutcome if the fhir_server is not valid", async () => {
    const request = {
      json: async () => {
        return PatientResource;
      },
      nextUrl: {
        searchParams: new URLSearchParams(
          "use_case=syphilis&fhir_server=invalid",
        ),
      },
    };
    const response = await POST(request as any);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(INVALID_FHIR_SERVERS);
  });

  it("should return a legitimate FHIR bundle if the query is successful", async () => {
    const request = {
      json: async () => {
        return PatientResource;
      },
      nextUrl: {
        searchParams: new URLSearchParams(
          "use_case=syphilis&fhir_server=HELIOS Meld: Direct",
        ),
      },
    };
    const response = await POST(request as any);
    const body = await response.json();
    expect(body.resourceType).toBe("Bundle");
  });
});
