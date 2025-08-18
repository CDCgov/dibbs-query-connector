import { Bundle, BundleEntry, Patient } from "fhir/r4";
import { readJsonFile } from "../shared_utils/readJsonFile";
import {
  INSUFFICIENT_PATIENT_IDENTIFIERS,
  INVALID_FHIR_SERVERS,
  INVALID_MESSAGE_FORMAT,
  MISSING_API_QUERY_PARAM,
  MISSING_PATIENT_IDENTIFIERS,
  RESPONSE_BODY_IS_NOT_PATIENT_RESOURCE,
  USE_CASE_DETAILS,
} from "@/app/constants";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/query/route";
import { GET } from "@/app/api/route";
import {
  PATIENT_HL7_MESSAGE,
  PATIENT_HL7_MESSAGE_NO_IDENTIFIERS,
  suppressConsoleLogs,
} from "./fixtures";

jest.mock("next-auth");
jest.mock("next-auth/providers/keycloak");

// Mock the validateServiceToken function
jest.mock("@/app/api/api-auth", () => ({
  validateServiceToken: jest.fn(),
}));

// Mock the FHIRClient to prevent real authentication requests
jest.mock("@/app/backend/fhir-servers/fhir-client", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockResolvedValue({
        resourceType: "Bundle",
        entry: [
          {
            resource: {
              resourceType: "Patient",
              id: "test-patient-123",
              name: [{ given: ["Test"], family: "Patient" }],
              identifier: [{ value: "MRN-12345" }],
            },
          },
        ],
      }),
      post: jest.fn().mockResolvedValue({
        status: 200,
        url: "http://mock-server.com/fhir",
        text: jest.fn().mockResolvedValue(""),
        json: jest.fn().mockResolvedValue({
          resourceType: "Bundle",
          entry: [],
        }),
      }),
      getAccessToken: jest.fn().mockResolvedValue("mock-token"),
      ensureValidToken: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

import { validateServiceToken } from "@/app/api/api-auth";
import { getOrCreateKeys } from "../../../../setup-scripts/gen-keys";
import { createSmartJwt } from "@/app/backend/smart-on-fhir";
import { E2E_SMART_TEST_CLIENT_ID } from "../../../../e2e/constants";
import { decodeJwt, decodeProtectedHeader } from "jose";

// Utility function to create a minimal NextRequest-like object
export function createNextRequest(
  body: unknown,
  searchParams: URLSearchParams,
  headers?: Record<string, string>,
): NextRequest {
  const requestHeaders = new Headers(headers);

  return {
    json: async () => body,
    text: async () => body,
    nextUrl: { searchParams },
    method: "POST",
    headers: requestHeaders,
  } as unknown as NextRequest;
}

jest.mock("@/app/utils/auth", () => {
  return {
    superAdminAccessCheck: jest.fn(() => Promise.resolve(true)),
    adminAccessCheck: jest.fn(() => Promise.resolve(true)),
  };
});

const PatientBundle = readJsonFile("./src/app/tests/assets/BundlePatient.json");
const PatientResource: Patient | undefined = (
  (PatientBundle as Bundle).entry as BundleEntry[]
)[0]?.resource as Patient;

if (!PatientResource || PatientResource.resourceType !== "Patient") {
  throw new Error("Invalid Patient resource in the test bundle.");
}

// Mock token payload for successful authentication
const mockTokenPayload = {
  aud: "api://query-connector-app-id",
  roles: ["api-user"],
  sub: "test-service-principal",
  iss: "https://sts.windows.net/test-tenant/",
  exp: Math.floor(Date.now() / 1000) + 3600,
};

describe("GET Health Check", () => {
  it("should return status OK (no auth required)", async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe("OK");
  });
});

describe("POST Query FHIR Server - Authentication", () => {
  beforeEach(() => {
    suppressConsoleLogs();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const SYPHILIS_QUERY_ID = USE_CASE_DETAILS.syphilis.id;
  const VALID_TOKEN = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI...";

  it("should return 401 when no authorization header is provided", async () => {
    // Mock validateServiceToken to return invalid
    (validateServiceToken as jest.Mock).mockResolvedValue({
      valid: false,
      error: "Missing or invalid authorization header",
    });

    const request = createNextRequest(
      PatientResource,
      new URLSearchParams(`id=${SYPHILIS_QUERY_ID}&fhir_server=Aidbox`),
    );

    const response = await POST(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
    expect(body.details).toBe("Missing or invalid authorization header");
  });

  it("should return 401 when authorization header is malformed", async () => {
    (validateServiceToken as jest.Mock).mockResolvedValue({
      valid: false,
      error: "Missing or invalid authorization header",
    });

    const request = createNextRequest(
      PatientResource,
      new URLSearchParams(`id=${SYPHILIS_QUERY_ID}&fhir_server=Aidbox`),
      { Authorization: "InvalidTokenFormat" },
    );

    const response = await POST(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("should return 401 when token is invalid", async () => {
    (validateServiceToken as jest.Mock).mockResolvedValue({
      valid: false,
      error: { code: "ERR_JWT_EXPIRED", message: "Token expired" },
    });

    const request = createNextRequest(
      PatientResource,
      new URLSearchParams(`id=${SYPHILIS_QUERY_ID}&fhir_server=Aidbox`),
      { Authorization: "Bearer invalid.token.here" },
    );

    const response = await POST(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("should return 401 when token is missing required role", async () => {
    (validateServiceToken as jest.Mock).mockResolvedValue({
      valid: false,
      error: "Invalid audience or role",
    });

    const request = createNextRequest(
      PatientResource,
      new URLSearchParams(`id=${SYPHILIS_QUERY_ID}&fhir_server=Aidbox`),
      { Authorization: VALID_TOKEN },
    );

    const response = await POST(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
    expect(body.details).toBe("Invalid audience or role");
  });
});

describe("POST Query FHIR Server - Authorized Requests", () => {
  beforeEach(() => {
    suppressConsoleLogs();
    jest.clearAllMocks();

    // Mock successful authentication for all tests in this describe block
    (validateServiceToken as jest.Mock).mockResolvedValue({
      valid: true,
      payload: mockTokenPayload,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const SYPHILIS_QUERY_ID = USE_CASE_DETAILS.syphilis.id;
  const VALID_TOKEN = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI...";

  it("should return an OperationOutcome if the request body is not a Patient resource", async () => {
    const request = createNextRequest(
      { resourceType: "Observation" },
      new URLSearchParams(`id=${SYPHILIS_QUERY_ID}&fhir_server=Aidbox`),
      { Authorization: VALID_TOKEN },
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
      new URLSearchParams(`id=${SYPHILIS_QUERY_ID}&fhir_server=Aidbox`),
      { Authorization: VALID_TOKEN },
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(MISSING_PATIENT_IDENTIFIERS);
  });

  it("should return an OperationOutcome if the id or fhir_server is missing", async () => {
    const request = createNextRequest(PatientResource, new URLSearchParams(), {
      Authorization: VALID_TOKEN,
    });
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(MISSING_API_QUERY_PARAM);
  });

  it("should return an OperationOutcome if the fhir_server is not valid", async () => {
    const request = createNextRequest(
      PatientResource,
      new URLSearchParams(`id=${SYPHILIS_QUERY_ID}&fhir_server=invalid`),
      { Authorization: VALID_TOKEN },
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
        "use_case=syphilis&fhir_server=Aidbox&message_format=invalid",
      ),
      { Authorization: VALID_TOKEN },
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(INVALID_MESSAGE_FORMAT);
  });

  it("should return a 400 Patient identifier error if HL7 message doesn't have identifiers", async () => {
    const request = createNextRequest(
      PATIENT_HL7_MESSAGE_NO_IDENTIFIERS,
      new URLSearchParams(
        `id=${SYPHILIS_QUERY_ID}&fhir_server=Aidbox&message_format=HL7`,
      ),
      { Authorization: VALID_TOKEN },
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(MISSING_PATIENT_IDENTIFIERS);
  });

  // Delete this test once we've messaged out the deprecation of use_case and
  // partners have switched over to using id
  it("should return a legitimate FHIR bundle if it uses the deprecated use_case param", async () => {
    const request = createNextRequest(
      PatientResource,
      new URLSearchParams("use_case=syphilis&fhir_server=Aidbox"),
      { Authorization: VALID_TOKEN },
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("Bundle");
  });

  it("should return a legitimate FHIR bundle if the query is successful", async () => {
    const request = createNextRequest(
      PatientResource,
      new URLSearchParams(`id=${SYPHILIS_QUERY_ID}&fhir_server=Aidbox`),
      { Authorization: VALID_TOKEN },
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("Bundle");

    // should also work if FHIR format type is explicitly specified
    const explicitFhirRequest = createNextRequest(
      PatientResource,
      new URLSearchParams(
        `id=${SYPHILIS_QUERY_ID}&fhir_server=Aidbox&message_format=FHIR`,
      ),
      { Authorization: VALID_TOKEN },
    );
    const explicitFhirResponse = await POST(explicitFhirRequest);
    const explicitFhirBody = await explicitFhirResponse.json();
    expect(explicitFhirBody.resourceType).toBe("Bundle");
  });

  it("should return a FHIR bundle if HL7 message is provided in the query body", async () => {
    const request = createNextRequest(
      PATIENT_HL7_MESSAGE,
      new URLSearchParams(
        `id=${SYPHILIS_QUERY_ID}&fhir_server=Aidbox&message_format=HL7`,
      ),
      { Authorization: VALID_TOKEN },
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("Bundle");
  });

  it("should return an OperationOutcome if patient search criteria do not meet validation rules (missing lastName and dob)", async () => {
    // Only firstName and MRN provided: should fail (missing lastName, dob)
    const invalidPatient = {
      resourceType: "Patient",
      name: [{ given: ["Test"] }], // no family/lastName
      identifier: [{ value: "MRN-12345" }],
    };

    const request = createNextRequest(
      invalidPatient,
      new URLSearchParams(`id=${SYPHILIS_QUERY_ID}&fhir_server=Aidbox`),
      { Authorization: VALID_TOKEN },
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("OperationOutcome");
    expect(body.issue[0].diagnostics).toBe(INSUFFICIENT_PATIENT_IDENTIFIERS);
  });

  it("should include service principal information in logs when authenticated", async () => {
    const request = createNextRequest(
      PatientResource,
      new URLSearchParams(`id=${SYPHILIS_QUERY_ID}&fhir_server=Aidbox`),
      { Authorization: VALID_TOKEN },
    );

    await POST(request);

    // Verify that validateServiceToken was called
    expect(validateServiceToken).toHaveBeenCalledWith(request);

    // You can add more specific logging assertions here if needed
  });
});

describe("Authentication with Different Providers", () => {
  beforeEach(() => {
    suppressConsoleLogs();
    jest.clearAllMocks();
  });

  const SYPHILIS_QUERY_ID = USE_CASE_DETAILS.syphilis.id;

  it("should accept valid Keycloak tokens", async () => {
    const keycloakPayload = {
      aud: ["query-connector", "account"],
      resource_access: {
        "query-connector": {
          roles: ["api-user"],
        },
      },
      preferred_username: "service-account-my-client",
      sub: "keycloak-service-principal",
      iss: "https://keycloak.example.com/realms/master",
    };

    (validateServiceToken as jest.Mock).mockResolvedValue({
      valid: true,
      payload: keycloakPayload,
    });

    const request = createNextRequest(
      PatientResource,
      new URLSearchParams(`id=${SYPHILIS_QUERY_ID}&fhir_server=Aidbox`),
      { Authorization: "Bearer keycloak.token.here" },
    );

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.resourceType).toBe("Bundle");
  });

  it("should accept valid Microsoft Entra ID tokens", async () => {
    const entraPayload = {
      aud: "api://cb4ee9e3-b51e-4dba-b6e4-ce40b8f0ed8a",
      roles: ["api-user"],
      appid: "c8d069ac-13b6-4aa3-9f95-f5bd485beda6",
      sub: "f63290bf-048e-458d-af8b-ab01c3e48347",
      iss: "https://sts.windows.net/28cf58df-efe8-4135-b2d1-f697ee74c00c/",
    };

    (validateServiceToken as jest.Mock).mockResolvedValue({
      valid: true,
      payload: entraPayload,
    });

    const request = createNextRequest(
      PatientResource,
      new URLSearchParams(`id=${SYPHILIS_QUERY_ID}&fhir_server=Aidbox`),
      { Authorization: "Bearer entra.token.here" },
    );

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.resourceType).toBe("Bundle");
  });
});

describe("SMART on FHIR JWT creation", () => {
  beforeEach(() => {
    suppressConsoleLogs();
    jest.clearAllMocks();
  });

  it("generates the correct token and signing creates the right request payload", async () => {
    const tokenEndpoint = `${process.env.AIDBOX_BASE_URL}/auth/token`;

    // make sure key pair exist, and create them if they don't
    await getOrCreateKeys();

    const outputJWT = await createSmartJwt(
      E2E_SMART_TEST_CLIENT_ID,
      tokenEndpoint,
    );

    const header = decodeProtectedHeader(outputJWT);
    expect(header.alg).toBe("RS384");
    expect(header.typ).toBe("JWT");
    expect(header.jku).toBe(
      `${process.env.APP_HOSTNAME}/.well-known/jwks.json`,
    );
    const claims = decodeJwt(outputJWT);
    expect(claims.aud).toBe(tokenEndpoint);
    expect(claims.iss).toBe(E2E_SMART_TEST_CLIENT_ID);
    expect(claims.sub).toBe(E2E_SMART_TEST_CLIENT_ID);
  });
});
