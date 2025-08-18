import { Task, Bundle, Patient } from "fhir/r4";
import { patientDiscoveryQuery } from "@/app/backend/query-execution/service";
import { prepareFhirClient } from "@/app/backend/fhir-servers/service";
import FHIRClient from "@/app/backend/fhir-servers/fhir-client";
import { suppressConsoleLogs } from "./fixtures";

jest.mock("@/app/utils/auth", () => ({
  superAdminAccessCheck: jest.fn().mockReturnValue(true),
}));

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

describe("Query Execution with Mutual TLS", () => {
  let mockFhirClient: jest.Mocked<FHIRClient>;

  beforeEach(() => {
    // suppressConsoleLogs();
    jest.clearAllMocks();

    // Mock setTimeout for Jest worker environment
    global.setTimeout = jest.fn((callback: () => void) => {
      callback();
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

  describe("Task-based patient discovery for mTLS servers", () => {
    const mockServerConfig = {
      id: "test-mtls",
      name: "Test mTLS Server",
      hostname: "https://mtls.example.com/fhir",
      mutualTls: true,
      disableCertValidation: false,
      defaultServer: false,
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

    const mockPatient: Patient = {
      resourceType: "Patient",
      id: "patient-123",
      name: [{ given: ["John"], family: "Doe" }],
      birthDate: "1990-01-01",
    };

    const mockPatientBundle: Bundle<Patient> = {
      resourceType: "Bundle",
      type: "searchset",
      entry: [
        {
          resource: mockPatient,
          fullUrl: "https://mtls.example.com/fhir/Patient/patient-123",
        },
      ],
    };

    beforeEach(() => {
      const {
        getFhirServerConfigs,
        getFhirServerNames,
      } = require("@/app/backend/fhir-servers/service");
      (getFhirServerConfigs as jest.Mock).mockResolvedValue([mockServerConfig]);
      (getFhirServerNames as jest.Mock).mockResolvedValue([
        mockServerConfig.name,
      ]);
    });

    it("should perform Task-based query for mTLS enabled server", async () => {
      // Mock the Task creation response
      mockFhirClient.postJson.mockResolvedValueOnce({
        status: 201,
        json: async () => ({
          resourceType: "Bundle",
          type: "collection",
          entry: [{ resource: mockParentTask }],
        }),
      } as Response);

      // Mock the child tasks polling - first incomplete, then complete
      mockFhirClient.get
        .mockResolvedValueOnce({
          status: 200,
          json: async () => ({
            resourceType: "Bundle",
            type: "searchset",
            entry: [
              {
                resource: { ...mockChildTask, status: "in-progress" },
              },
            ],
          }),
        } as Response)
        .mockResolvedValueOnce({
          status: 200,
          json: async () => ({
            resourceType: "Bundle",
            type: "searchset",
            entry: [
              {
                resource: mockChildTask,
              },
            ],
          }),
        } as Response);

      const patientResult = {
        status: 200,
        json: async () => mockPatient,
      } as Response;
      // Mock the patient results fetch
      mockFhirClient.get.mockResolvedValueOnce(patientResult);

      const request = {
        fhirServer: "Test mTLS Server",
        firstName: "John",
        lastName: "Doe",
        dob: "1990-01-01",
      };

      const result = await patientDiscoveryQuery(request);

      // Verify Task was created with correct structure
      expect(mockFhirClient.postJson).toHaveBeenCalledWith(
        "/Task",
        expect.objectContaining({
          resourceType: "Task",
          status: "requested",
          intent: "order",
          input: expect.arrayContaining([
            expect.objectContaining({
              valueString: expect.stringContaining(
                "given=John&family=Doe&birthdate=1990-01-01",
              ),
            }),
          ]),
        }),
      );

      // Verify polling for child tasks
      expect(mockFhirClient.get).toHaveBeenCalledWith(
        "/Task?part-of=Task/parent-task-123",
      );

      // Verify patient results were fetched
      expect(mockFhirClient.get).toHaveBeenCalledWith(
        expect.stringContaining("/ndjson/results/Patient-Page1.ndjson"),
      );

      console.log(result);
      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockPatient);
    });

    it("should handle multiple child tasks from different organizations", async () => {
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
        id: "patient-456",
        name: [{ given: ["John"], family: "Doe" }],
        birthDate: "1990-01-01",
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

      // Mock child tasks response with two completed tasks
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
          json: async () => mockPatient,
        } as Response)
        .mockResolvedValueOnce({
          status: 200,
          json: async () => mockPatient2,
        } as Response);

      const request = {
        fhirServer: "Test mTLS Server",
        firstName: "John",
        lastName: "Doe",
        dob: "1990-01-01",
      };

      const result = await patientDiscoveryQuery(request);

      // Should return both patients
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockPatient);
      expect(result).toContainEqual(mockPatient2);
    });

    it("should handle failed child tasks gracefully", async () => {
      const failedChildTask: Task = {
        resourceType: "Task",
        id: "child-task-failed",
        status: "failed",
        intent: "order",
        partOf: [{ reference: "Task/parent-task-123" }],
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

      // Mock child tasks with one failed and one completed
      mockFhirClient.get.mockResolvedValueOnce({
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),

        json: async () => ({
          resourceType: "Bundle",
          type: "searchset",
          entry: [{ resource: mockChildTask }, { resource: failedChildTask }],
        }),
      } as Response);

      // Mock patient results
      mockFhirClient.get.mockResolvedValueOnce({
        status: 200,
        json: async () => mockPatient,
      } as Response);

      const request = {
        fhirServer: "Test mTLS Server",
        firstName: "John",
        lastName: "Doe",
        dob: "1990-01-01",
      };

      const result = await patientDiscoveryQuery(request);

      // Should only return the successful patient
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockPatient);
    });

    it("should retry fetching patient resource if initially unavailable", async () => {
      // Mock Task creation
      mockFhirClient.postJson.mockResolvedValueOnce({
        status: 201,
        json: async () => ({
          resourceType: "Bundle",
          type: "collection",
          entry: [{ resource: mockParentTask }],
        }),
      } as Response);

      // Mock child tasks completed
      mockFhirClient.get.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          resourceType: "Bundle",
          type: "searchset",
          entry: [{ resource: mockChildTask }],
        }),
      } as Response);

      // Mock patient results - first attempt fails, second succeeds
      mockFhirClient.get
        .mockResolvedValueOnce({
          status: 404,
          text: async () => "Not found",
        } as Response)
        .mockResolvedValueOnce({
          status: 200,
          json: async () => mockPatient,
        } as Response);

      const request = {
        fhirServer: "Test mTLS Server",
        firstName: "John",
        lastName: "Doe",
        dob: "1990-01-01",
      };

      const result = await patientDiscoveryQuery(request);

      // Should eventually return the patient
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockPatient);
      expect(mockFhirClient.get).toHaveBeenCalledTimes(3); // child tasks + 2 patient attempts
    });

    it("should handle non-mTLS servers with standard Patient query", async () => {
      // Mock a non-mTLS server config
      const nonMtlsServerConfig = {
        ...mockServerConfig,
        mutualTls: false,
      };

      const {
        getFhirServerConfigs,
        getFhirServerNames,
      } = require("@/app/backend/fhir-servers/service");
      (getFhirServerConfigs as jest.Mock).mockResolvedValue([
        nonMtlsServerConfig,
      ]);
      (getFhirServerNames as jest.Mock).mockResolvedValue([
        nonMtlsServerConfig.name,
      ]);

      // Mock standard patient search response
      const standardPatientResponse = {
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockPatientBundle,
        clone: () => standardPatientResponse,
      } as Response;
      mockFhirClient.get.mockResolvedValueOnce(standardPatientResponse);

      const request = {
        fhirServer: "Test mTLS Server",
        firstName: "John",
        lastName: "Doe",
        dob: "1990-01-01",
      };

      const result = await patientDiscoveryQuery(request);

      // Should use GET to /Patient instead of POST to /Task
      expect(mockFhirClient.postJson).not.toHaveBeenCalled();
      expect(mockFhirClient.get).toHaveBeenCalledWith(
        "/Patient?given=John&family=Doe&birthdate=1990-01-01",
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockPatient);
    });
  });
});
