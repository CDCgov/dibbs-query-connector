import { Bundle, Task, Patient } from "fhir/r4";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/query/route";
import { suppressConsoleLogs } from "./fixtures";
import { USE_CASE_DETAILS } from "@/app/constants";
import { prepareFhirClient } from "@/app/backend/fhir-servers/service";
import FHIRClient from "@/app/backend/fhir-servers/fhir-client";

// Utility function to create a minimal NextRequest-like object
function createNextRequest(
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

jest.mock("next-auth");
jest.mock("next-auth/providers/keycloak");

// Mock the validateServiceToken function
jest.mock("@/app/api/api-auth", () => ({
  validateServiceToken: jest.fn().mockResolvedValue({
    valid: true,
    payload: {
      aud: "api://query-connector-app-id",
      roles: ["api-user"],
      sub: "test-service-principal",
      iss: "https://sts.windows.net/test-tenant/",
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
  }),
}));

jest.mock("@/app/utils/auth", () => {
  return {
    superAdminAccessCheck: jest.fn(() => Promise.resolve(true)),
    adminAccessCheck: jest.fn(() => Promise.resolve(true)),
  };
});

const mockPatientGet = {
  status: 200,
  json: async () => ({
    resourceType: "Bundle",
    type: "searchset",
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: "test-patient-123",
          name: [{ given: ["John"], family: "Doe" }],
          birthDate: "1990-01-01",
          identifier: [
            {
              type: {
                coding: [
                  {
                    system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                    code: "MR",
                  },
                ],
              },
              system: "http://hospital.org/mrn",
              value: "MRN-12345",
            },
          ],
        },
      },
    ],
  }),
  text: async () => "",
  headers: new Headers({ "content-type": "application/json" }),
  url: "http://mock-server.com/fhir",
};

jest.mock("@/app/backend/fhir-servers/fhir-client", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockResolvedValue({
        status: 200,
        json: async () => ({
          resourceType: "Bundle",
          type: "searchset",
          entry: [
            {
              resource: {
                resourceType: "Patient",
                id: "test-patient-123",
                name: [{ given: ["John"], family: "Doe" }],
                birthDate: "1990-01-01",
                identifier: [
                  {
                    type: {
                      coding: [
                        {
                          system:
                            "http://terminology.hl7.org/CodeSystem/v2-0203",
                          code: "MR",
                        },
                      ],
                    },
                    system: "http://hospital.org/mrn",
                    value: "MRN-12345",
                  },
                ],
              },
            },
          ],
        }),
        text: async () => "",
        clone: async () => mockPatientGet,
        headers: new Headers({ "content-type": "application/json" }),
        url: "http://mock-server.com/fhir",
      }),
      post: jest.fn().mockResolvedValue({
        status: 200,
        url: "http://mock-server.com/fhir",
        text: jest.fn().mockResolvedValue(""),
        json: jest.fn().mockResolvedValue({
          resourceType: "Bundle",
          type: "searchset",
          entry: [],
        }),
        headers: new Headers(),
      }),
      postJson: jest.fn().mockResolvedValue({
        status: 201,
        json: async () => ({
          resourceType: "Bundle",
          type: "collection",
          entry: [
            {
              resource: {
                resourceType: "Task",
                id: "parent-task-123",
                status: "requested",
                intent: "order",
              },
            },
          ],
        }),
        headers: new Headers(),
        url: "http://mock-server.com/fhir",
      }),
      getBatch: jest.fn(),
    })),
  };
});

jest.mock("@/app/backend/fhir-servers/service", () => ({
  prepareFhirClient: jest.fn(),
  getFhirServerConfigs: jest.fn(),
  getFhirServerNames: jest.fn(),
}));

jest.mock("@/app/utils/mtls-utils", () => ({
  getOrCreateMtlsCert: jest.fn().mockReturnValue("mock-cert"),
  getOrCreateMtlsKey: jest.fn().mockReturnValue("mock-key"),
  isMtlsAvailable: jest.fn().mockReturnValue(true),
}));

jest.mock("@/app/backend/audit-logs/decorator", () => ({
  auditable: jest
    .fn()
    .mockImplementation(
      () =>
        (
          target: unknown,
          propertyName: string,
          descriptor: PropertyDescriptor,
        ) => {
          return descriptor;
        },
    ),
}));

// Mock critical missing dependencies
jest.mock("@/app/utils/format-service", () => ({
  GetPhoneQueryFormats: jest
    .fn()
    .mockResolvedValue(["555-123-4567", "5551234567"]),
}));

jest.mock("@/app/backend/query-building/service", () => ({
  getSavedQueryByName: jest.fn().mockResolvedValue({
    queryName: "Syphilis",
    queryData: {},
    medicalRecordSections: {},
  }),
  getSavedQueryById: jest.fn().mockResolvedValue({
    queryName: "Syphilis",
    queryData: {},
    medicalRecordSections: {},
  }),
}));

jest.mock("@/app/api/query/parsers", () => ({
  parseHL7FromRequestBody: jest.fn().mockImplementation((body) => body),
  parsePatientDemographics: jest.fn().mockReturnValue({
    first_name: "John",
    last_name: "Doe",
    dob: "1990-01-01",
    mrn: "MRN-12345",
    phone: "555-123-4567",
    street1: "123 Main St",
    city: "Anytown",
    state: "CA",
    zip: "12345",
    email: "john.doe@example.com",
  }),
  mapDeprecatedUseCaseToId: jest.fn().mockImplementation((useCase) => useCase),
}));

jest.mock("@/app/models/entities/query", () => ({
  validatedPatientSearch: jest.fn().mockReturnValue(true),
}));

jest.mock("@/app/backend/query-execution/custom-query", () => ({
  CustomQuery: jest.fn().mockImplementation(() => ({
    getQuery: jest.fn().mockReturnValue({
      basePath: "/Observation",
      params: { patient: "test-patient-123" },
    }),
    compileAllPostRequests: jest.fn().mockReturnValue([
      {
        path: "/Observation",
        params: { patient: "test-patient-123" },
      },
    ]),
  })),
}));

jest.mock("node-hl7-client", () => ({
  Message: jest.fn().mockImplementation(({ text: _text }) => ({
    get: jest.fn().mockImplementation((path) => {
      const mockData = {
        "PID.5.2": "John",
        "PID.5.1": "Doe",
        "PID.7.1": "19900101",
        "PID.3.1": "MRN-12345",
        "PID.11.1": "123 Main St",
        "PID.11.2": "",
        "PID.11.3": "Anytown",
        "PID.11.4": "CA",
        "PID.11.5": "12345",
        "NK1.5.1": "555-123-4567",
        "PID.13.4": "john.doe@example.com",
      };
      return { toString: () => mockData[path] || "" };
    }),
  })),
}));

import { validateServiceToken } from "@/app/api/api-auth";

describe("API Query with Mutual TLS", () => {
  let mockFhirClient: jest.Mocked<FHIRClient>;
  const SYPHILIS_QUERY_ID = USE_CASE_DETAILS.syphilis.id;
  const VALID_TOKEN = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI...";

  const mockPatientResource: Patient = {
    resourceType: "Patient",
    id: "test-patient-123",
    name: [{ given: ["John"], family: "Doe" }],
    birthDate: "1990-01-01",
    identifier: [
      {
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "MR",
            },
          ],
        },
        system: "http://hospital.org/mrn",
        value: "MRN-12345",
      },
    ],
  };

  const mockParentTask: Task = {
    resourceType: "Task",
    id: "parent-task-123",
    status: "requested",
    intent: "order",
  };

  const mockChildTask: Task = {
    resourceType: "Task",
    id: "child-task-456",
    status: "completed",
    intent: "order",
    partOf: [{ reference: "Task/parent-task-123" }],
    output: [
      {
        type: { text: "patient-results" },
        valueString:
          "https://mtls.example.com/ndjson/results/Patient-Page1.ndjson",
      },
    ],
  };

  const mockPatientBundle: Bundle<Patient> = {
    resourceType: "Bundle",
    type: "searchset",
    entry: [
      {
        resource: mockPatientResource,
        fullUrl: "https://mtls.example.com/fhir/Patient/test-patient-123",
      },
    ],
  };

  beforeEach(() => {
    suppressConsoleLogs();
    jest.clearAllMocks();

    // Mock successful authentication
    (validateServiceToken as jest.Mock).mockResolvedValue({
      valid: true,
      payload: {
        aud: "api://query-connector-app-id",
        roles: ["api-user"],
        sub: "test-service-principal",
        iss: "https://sts.windows.net/test-tenant/",
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    });

    // Mock setTimeout to avoid actual delays in tests
    global.setTimeout = jest.fn((callback: () => void, delay: number) => {
      // For polling delays, execute callback asynchronously to avoid blocking
      if (delay >= 5000) {
        process.nextTick(callback);
      } else if (typeof callback === "function") {
        callback();
      }
      return 0 as NodeJS.Timeout;
    });

    mockFhirClient = {
      get: jest.fn(),
      post: jest.fn(),
      postJson: jest.fn(),
      getBatch: jest.fn(),
    } as jest.Mocked<FHIRClient>;

    (prepareFhirClient as jest.Mock).mockResolvedValue(mockFhirClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("mTLS-enabled FHIR server queries", () => {
    beforeEach(() => {
      const mockMtlsServerConfig = {
        id: "test-mtls",
        name: "mTLS QHIN Server",
        hostname: "https://mtls.example.com/fhir",
        mutualTls: true, // Enable mTLS for proper testing
        disableCertValidation: false,
        defaultServer: false,
      };

      const {
        getFhirServerConfigs,
        getFhirServerNames,
      } = require("@/app/backend/fhir-servers/service");
      (getFhirServerConfigs as jest.Mock).mockResolvedValue([
        mockMtlsServerConfig,
      ]);
      (getFhirServerNames as jest.Mock).mockResolvedValue(["mTLS QHIN Server"]);
    });

    it("should handle patient discovery via Task for mTLS server", async () => {
      // Mock Task creation
      mockFhirClient.postJson.mockResolvedValueOnce({
        status: 201,
        json: async () => ({
          resourceType: "Bundle",
          type: "collection",
          entry: [{ resource: mockParentTask }],
        }),
      } as Response);

      // Mock child tasks polling - immediately completed
      mockFhirClient.get.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          resourceType: "Bundle",
          type: "searchset",
          entry: [{ resource: mockChildTask }],
        }),
      } as Response);

      // Mock patient results
      mockFhirClient.get.mockResolvedValueOnce({
        status: 200,
        json: async () => mockPatientResource,
      } as Response);

      // Mock query execution for patient records
      mockFhirClient.post.mockResolvedValue({
        status: 200,
        json: async () => ({
          resourceType: "Bundle",
          type: "searchset",
          entry: [],
        }),
      } as Response);

      const request = createNextRequest(
        mockPatientResource,
        new URLSearchParams(
          `id=${SYPHILIS_QUERY_ID}&fhir_server=mTLS QHIN Server`,
        ),
        { Authorization: VALID_TOKEN },
      );

      const response = await POST(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.resourceType).toBe("Bundle");

      // Verify Task was created
      expect(mockFhirClient.postJson).toHaveBeenCalledWith(
        "/Task",
        expect.objectContaining({
          resourceType: "Task",
          status: "requested",
          intent: "order",
        }),
      );
    });

    it("should handle multiple organizations returning patient results", async () => {
      const mockChildTask2: Task = {
        resourceType: "Task",
        id: "child-task-789",
        status: "completed",
        intent: "order",
        partOf: [{ reference: "Task/parent-task-123" }],
        output: [
          {
            type: { text: "patient-results" },
            valueString:
              "https://mtls2.example.com/ndjson/results/Patient-Page1.ndjson",
          },
        ],
      };

      const mockPatient2: Patient = {
        resourceType: "Patient",
        id: "test-patient-456",
        name: [{ given: ["John"], family: "Doe" }],
        birthDate: "1990-01-01",
        identifier: [
          {
            type: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                  code: "MR",
                },
              ],
            },
            system: "http://hospital2.org/mrn",
            value: "MRN-67890",
          },
        ],
      };

      // Mock Task creation
      mockFhirClient.postJson.mockResolvedValueOnce({
        status: 201,
        json: async () => ({
          resourceType: "Bundle",
          type: "collection",
          entry: [{ resource: mockParentTask }],
        }),
      } as Response);

      // Mock child tasks with two completed tasks
      mockFhirClient.get.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          resourceType: "Bundle",
          type: "searchset",
          entry: [{ resource: mockChildTask }, { resource: mockChildTask2 }],
        }),
      } as Response);

      // Mock patient results fetches
      mockFhirClient.get
        .mockResolvedValueOnce({
          status: 200,
          json: async () => mockPatientResource,
        } as Response)
        .mockResolvedValueOnce({
          status: 200,
          json: async () => mockPatient2,
        } as Response);

      // Mock query execution
      mockFhirClient.post.mockResolvedValue({
        status: 200,
        json: async () => ({
          resourceType: "Bundle",
          type: "searchset",
          entry: [],
        }),
      } as Response);

      const request = createNextRequest(
        mockPatientResource,
        new URLSearchParams(
          `id=${SYPHILIS_QUERY_ID}&fhir_server=mTLS QHIN Server`,
        ),
        { Authorization: VALID_TOKEN },
      );

      const response = await POST(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.resourceType).toBe("Bundle");

      // Should have entries from both organizations
      const patientEntries = body.entry?.filter(
        (e: { resource?: { resourceType?: string } }) =>
          e.resource?.resourceType === "Patient",
      );
      expect(patientEntries).toHaveLength(2);
    });

    it("should handle HL7 message format with mTLS server", async () => {
      const hl7Message = `MSH|^~\\&|SENDING_APP|SENDING_FAC|RECEIVING_APP|RECEIVING_FAC|202501010000||ADT^A01|MSG001|P|2.5|||||||||||
EVN|A01|202501010000||
PID|1||MRN-12345^^^HOSPITAL^MR||DOE^JOHN^A||19900101|M|||123 MAIN ST^^ANYTOWN^CA^12345^USA||(555)123-4567|||S||SSN-123-45-6789|||||||||||||||||
PV1|1|I|ROOM-123^BED-A^HOSP||||ATTENDING^DOCTOR^A|||||||||||ADM001|||||||||||||||||||||||||202501010000|||||||`;

      // Mock Task creation and subsequent calls as before
      mockFhirClient.postJson.mockResolvedValueOnce({
        status: 201,
        json: async () => ({
          resourceType: "Bundle",
          type: "collection",
          entry: [{ resource: mockParentTask }],
        }),
      } as Response);

      mockFhirClient.get
        .mockResolvedValueOnce({
          status: 200,
          json: async () => ({
            resourceType: "Bundle",
            type: "searchset",
            entry: [{ resource: mockChildTask }],
          }),
        } as Response)
        .mockResolvedValueOnce({
          status: 200,
          json: async () => mockPatientResource,
        } as Response);

      mockFhirClient.post.mockResolvedValue({
        status: 200,
        json: async () => ({
          resourceType: "Bundle",
          type: "searchset",
          entry: [],
        }),
      } as Response);

      const request = createNextRequest(
        hl7Message,
        new URLSearchParams(
          `id=${SYPHILIS_QUERY_ID}&fhir_server=mTLS QHIN Server&message_format=HL7`,
        ),
        { Authorization: VALID_TOKEN },
      );

      const response = await POST(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.resourceType).toBe("Bundle");
    });
  });

  describe("Non-mTLS server queries", () => {
    beforeEach(() => {
      const mockNonMtlsServerConfig = {
        id: "test-regular",
        name: "Regular FHIR Server",
        hostname: "https://regular.example.com/fhir",
        mutualTls: false,
        disableCertValidation: false,
        defaultServer: false,
      };

      const {
        getFhirServerConfigs,
        getFhirServerNames,
      } = require("@/app/backend/fhir-servers/service");
      (getFhirServerConfigs as jest.Mock).mockResolvedValue([
        mockNonMtlsServerConfig,
      ]);
      (getFhirServerNames as jest.Mock).mockResolvedValue([
        "Regular FHIR Server",
      ]);
    });

    it("should use standard Patient query for non-mTLS servers", async () => {
      const standardPatientResponse = {
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockPatientBundle,
        clone: () => standardPatientResponse,
      } as Response;
      // Mock standard patient search
      mockFhirClient.get.mockResolvedValueOnce(standardPatientResponse);

      const mockQueryExecution = {
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        clone: () => mockQueryExecution,
        json: async () => ({
          resourceType: "Bundle",
          type: "searchset",
          entry: [],
        }),
      } as Response;
      // Mock query execution
      mockFhirClient.post.mockResolvedValue(mockQueryExecution);

      const request = createNextRequest(
        mockPatientResource,
        new URLSearchParams(
          `id=${SYPHILIS_QUERY_ID}&fhir_server=Regular FHIR Server`,
        ),
        { Authorization: VALID_TOKEN, "content-type": "application/json" },
      );

      const response = await POST(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.resourceType).toBe("Bundle");

      // Should NOT create a Task
      expect(mockFhirClient.postJson).not.toHaveBeenCalled();

      // Should use GET to /Patient
      expect(mockFhirClient.get).toHaveBeenCalledWith(
        expect.stringContaining("/Patient?"),
      );
    });
  });
});
