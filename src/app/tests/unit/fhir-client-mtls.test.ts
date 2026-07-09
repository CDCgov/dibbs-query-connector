import FHIRClient from "@/app/backend/fhir-servers/fhir-client";
import { FhirServerConfig } from "@/app/models/entities/fhir-servers";
import { testFhirServerConnection } from "@/app/backend/fhir-servers/test-utils";
import { Agent, fetch as undiciFetch } from "undici";
import * as mtlsUtils from "@/app/utils/mtls-utils";

// Mutual-TLS requests must go through undici's own fetch (a dispatcher is
// only compatible with the fetch from the same undici package), so mock that
// fetch while keeping the real Agent for dispatcher-option assertions.
jest.mock("undici", () => ({
  ...jest.requireActual("undici"),
  fetch: jest.fn(),
}));

const mockCert =
  "-----BEGIN CERTIFICATE-----\nMOCK_CERT\n-----END CERTIFICATE-----";
const mockKey =
  "-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----";

jest.mock("@/app/utils/mtls-utils", () => {
  return {
    isMtlsAvailable: jest.fn().mockReturnValue(true),
    getOrCreateMtlsCert: jest
      .fn()
      .mockReturnValue(
        "-----BEGIN CERTIFICATE-----\nMOCK_CERT\n-----END CERTIFICATE-----",
      ),
    getOrCreateMtlsKey: jest
      .fn()
      .mockReturnValue(
        "-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----",
      ),
  };
});

// Mock the smart-on-fhir module
jest.mock("@/app/backend/smart-on-fhir", () => ({
  createSmartJwt: jest.fn().mockResolvedValue("mocked-jwt-token"),
}));

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;
const mockUndiciFetch = undiciFetch as jest.Mock;

describe("FHIRClient with Mutual TLS", () => {
  beforeEach(() => {
    mockFetch.mockClear();

    jest.clearAllMocks();
    (mtlsUtils.getOrCreateMtlsCert as jest.Mock).mockReturnValue(mockCert);
    (mtlsUtils.getOrCreateMtlsKey as jest.Mock).mockReturnValue(mockKey);
  });

  describe("FHIRClient initialization", () => {
    it("should initialize with mutual TLS when enabled", () => {
      const testCaCert =
        "-----BEGIN CERTIFICATE-----\nTEST_CA_CERT\n-----END CERTIFICATE-----";
      const config: FhirServerConfig = {
        id: "test",
        name: "Test Server",
        hostname: "https://mtls.example.com/fhir",
        authType: "mutual-tls",
        caCert: testCaCert,
        disableCertValidation: false,
        defaultServer: false,
      };

      const _client = new FHIRClient(config);

      expect(mtlsUtils.getOrCreateMtlsCert).toHaveBeenCalled();
      expect(mtlsUtils.getOrCreateMtlsKey).toHaveBeenCalled();
    });

    it("should throw error if mTLS is enabled but certificates are not available", () => {
      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      (mtlsUtils.getOrCreateMtlsCert as jest.Mock).mockImplementation(() => {
        throw new Error("Certificate not found");
      });

      const config: FhirServerConfig = {
        id: "test",
        name: "Test Server",
        hostname: "https://mtls.example.com/fhir",
        authType: "mutual-tls",
        disableCertValidation: false,
        defaultServer: false,
      };

      expect(() => new FHIRClient(config)).toThrow(
        "Mutual TLS is enabled but certificates are not available",
      );

      consoleSpy.mockRestore();
    });

    it("should initialize without mTLS when disabled", () => {
      const config: FhirServerConfig = {
        id: "test",
        name: "Test Server",
        hostname: "https://example.com/fhir",
        authType: "none",
        disableCertValidation: false,
        defaultServer: false,
      };

      const _client = new FHIRClient(config);

      expect(mtlsUtils.getOrCreateMtlsCert).not.toHaveBeenCalled();
      expect(mtlsUtils.getOrCreateMtlsKey).not.toHaveBeenCalled();
    });
  });

  describe("HTTP requests with mutual TLS", () => {
    it("should make GET request with mTLS certificates", async () => {
      const mockResponse = {
        status: 200,
        ok: true,
        json: async () => ({ resourceType: "Bundle" }),
      };

      mockUndiciFetch.mockResolvedValue(mockResponse as never);

      const config: FhirServerConfig = {
        id: "test",
        name: "Test Server",
        hostname: "https://mtls.example.com/fhir",
        authType: "mutual-tls",
        disableCertValidation: false,
        defaultServer: false,
      };

      const client = new FHIRClient(config);
      const _response = await client.get("/Patient");

      expect(mockUndiciFetch).toHaveBeenCalledWith(
        "https://mtls.example.com/fhir/Patient",
        expect.objectContaining({
          method: "GET",
          headers: {},
          dispatcher: expect.any(Agent),
        }),
      );

      // Verify the agent has the correct properties
      const dispatcher: Agent = mockUndiciFetch.mock.calls[0][1].dispatcher;
      const constructOptions = Object.getOwnPropertySymbols(dispatcher).find(
        (s) => s.description === "options",
      ) as keyof Agent;
      const dispatcherOptions = dispatcher[constructOptions];

      expect(dispatcherOptions).toMatchObject({
        connect: {
          cert: mockCert,
          key: mockKey,
          ca: "",
          rejectUnauthorized: true,
        },
      });
    });

    it("should use the global fetch when the e2e fetch interceptor is applied", async () => {
      // E2E tests stub outbound requests by patching the global fetch, which
      // undici's fetch would bypass (see fetchWithMutualTLS in fhir-client.ts).
      // request-mocking-protocol marks the patched global fetch with this
      // symbol.
      const interceptorSymbol = Symbol.for(
        "request-mocking-protocol.fetchInterceptorApplied",
      );
      Object.defineProperty(globalThis, interceptorSymbol, {
        value: true,
        configurable: true,
      });
      try {
        const mockResponse = {
          status: 200,
          ok: true,
          json: async () => ({ resourceType: "Bundle" }),
        };
        mockFetch.mockResolvedValue(mockResponse as never);

        const config: FhirServerConfig = {
          id: "test",
          name: "Test Server",
          hostname: "https://mtls.example.com/fhir",
          authType: "mutual-tls",
          disableCertValidation: false,
          defaultServer: false,
        };

        const client = new FHIRClient(config);
        await client.get("/Patient");

        expect(mockFetch).toHaveBeenCalledWith(
          "https://mtls.example.com/fhir/Patient",
          expect.objectContaining({ method: "GET" }),
        );
        expect(mockUndiciFetch).not.toHaveBeenCalled();
      } finally {
        Reflect.deleteProperty(globalThis, interceptorSymbol);
      }
    });

    it("should make POST JSON request with mTLS certificates", async () => {
      const mockResponse = {
        status: 201,
        ok: true,
        json: async () => ({ resourceType: "Task", id: "123" }),
      };

      mockUndiciFetch.mockResolvedValue(mockResponse as never);

      const config: FhirServerConfig = {
        id: "test",
        name: "Test Server",
        hostname: "https://mtls.example.com/fhir",
        authType: "mutual-tls",
        disableCertValidation: false,
        defaultServer: false,
      };

      const client = new FHIRClient(config);
      const taskData = {
        resourceType: "Task",
        status: "requested",
        intent: "order",
      };

      const _response = await client.postJson("/Task", taskData);

      expect(mockUndiciFetch).toHaveBeenCalledWith(
        "https://mtls.example.com/fhir/Task",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/fhir+json",
            PREFER: "return=representation",
          }),
          body: JSON.stringify(taskData),
          dispatcher: expect.any(Agent),
        }),
      );
    });

    it("should handle both mTLS and SSL certificate validation disabled", async () => {
      const mockResponse = {
        status: 200,
        ok: true,
        json: async () => ({ resourceType: "Bundle" }),
      };

      mockUndiciFetch.mockResolvedValue(mockResponse as never);

      const config: FhirServerConfig = {
        id: "test",
        name: "Test Server",
        hostname: "https://mtls.example.com/fhir",
        authType: "mutual-tls",
        disableCertValidation: true,
        defaultServer: false,
      };

      const client = new FHIRClient(config);
      await client.get("/Patient");

      // Verify the agent has the correct properties
      const dispatcher: Agent = mockUndiciFetch.mock.calls[0][1].dispatcher;
      const constructOptions = Object.getOwnPropertySymbols(dispatcher).find(
        (s) => s.description === "options",
      ) as keyof Agent;
      const dispatcherOptions = dispatcher[constructOptions];

      expect(dispatcherOptions).toMatchObject({
        connect: {
          cert: mockCert,
          key: mockKey,
          ca: "",
          rejectUnauthorized: false,
        },
      });
    });

    it("should include CA certificate when provided", async () => {
      const mockResponse = {
        status: 200,
        ok: true,
        json: async () => ({ resourceType: "Bundle" }),
      };

      mockUndiciFetch.mockResolvedValue(mockResponse as never);

      const testCaCert =
        "-----BEGIN CERTIFICATE-----\nTEST_CA_CERT\n-----END CERTIFICATE-----";
      const config: FhirServerConfig = {
        id: "test",
        name: "Test Server",
        hostname: "https://mtls.example.com/fhir",
        authType: "mutual-tls",
        caCert: testCaCert,
        disableCertValidation: false,
        defaultServer: false,
      };

      const client = new FHIRClient(config);
      await client.get("/Patient");

      expect(mockUndiciFetch).toHaveBeenCalledWith(
        "https://mtls.example.com/fhir/Patient",
        expect.objectContaining({
          method: "GET",
          headers: {},
          dispatcher: expect.any(Agent),
        }),
      );

      // Verify the agent has the CA certificate
      const dispatcher: Agent = mockUndiciFetch.mock.calls[0][1].dispatcher;
      const constructOptions = Object.getOwnPropertySymbols(dispatcher).find(
        (s) => s.description === "options",
      ) as keyof Agent;
      const dispatcherOptions = dispatcher[constructOptions];

      expect(dispatcherOptions).toMatchObject({
        connect: {
          cert: mockCert,
          key: mockKey,
          ca: testCaCert,
          rejectUnauthorized: true,
        },
      });
    });
  });

  describe("Connection testing by endpoint type", () => {
    it("treats a 404 on /Task as reachable for a fanout mTLS server", async () => {
      const mockResponse = {
        // A fanout server returns 404 for the dummy task id but is reachable.
        status: 404,
        ok: false,
        text: async () => "Not found",
      };

      mockUndiciFetch.mockResolvedValue(mockResponse as never);

      const result = await testFhirServerConnection(
        "https://mtls.example.com/fhir",
        false,
        { authType: "mutual-tls", endpointType: "fanout" },
      );

      expect(result.success).toBe(true);
      expect(mockUndiciFetch).toHaveBeenCalledWith(
        expect.stringContaining("/Task/foo"),
        expect.any(Object),
      );
    });

    it("probes /Immunization for an immunization gateway", async () => {
      const mockResponse = {
        status: 200,
        ok: true,
        json: async () => ({ resourceType: "Bundle", total: 0 }),
      };

      mockUndiciFetch.mockResolvedValue(mockResponse as never);

      const result = await testFhirServerConnection(
        "https://mtls.example.com/fhir",
        false,
        { authType: "mutual-tls", endpointType: "immunization" },
      );

      expect(result.success).toBe(true);
      expect(mockUndiciFetch).toHaveBeenCalledWith(
        expect.stringContaining("/Immunization"),
        expect.any(Object),
      );
    });

    it("probes /Patient for a standard (non-mTLS) server", async () => {
      const mockResponse = {
        status: 200,
        ok: true,
        json: async () => ({ resourceType: "Bundle", total: 0 }),
      };

      mockFetch.mockResolvedValue(mockResponse as never);

      const result = await testFhirServerConnection(
        "https://example.com/fhir",
        false,
        { authType: "none" },
      );

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/Patient?name=AuthenticatedServerConnectionTest",
        ),
        expect.any(Object),
      );
    });

    it("surfaces the HTTP status when the server returns 401", async () => {
      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const mockResponse = {
        status: 401,
        ok: false,
        text: async () => "Unauthorized",
      };

      mockUndiciFetch.mockResolvedValue(mockResponse as never);

      const result = await testFhirServerConnection(
        "https://mtls.example.com/fhir",
        false,
        { authType: "mutual-tls", endpointType: "immunization" },
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("401");

      consoleSpy.mockRestore();
    });

    it("should handle connection test failure when the request throws", async () => {
      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockFetch.mockRejectedValue(new Error("Connection refused"));

      const result = await testFhirServerConnection(
        "https://mtls.example.com/fhir",
        true,
        { authType: "none" },
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Connection refused");

      consoleSpy.mockRestore();
    });
  });

  describe("OAuth token endpoint discovery with mTLS", () => {
    it("should discover token endpoint with mTLS certificates", async () => {
      // Suppress console errors for this test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const mockWellKnownResponse = {
        status: 200,
        ok: true,
        json: async () => ({
          token_endpoint: "https://mtls.example.com/auth/token",
        }),
      };

      const mockTokenResponse = {
        status: 200,
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "test-token",
            expires_in: 3600,
          }),
      };

      const mockPatientResponse = {
        status: 200,
        ok: true,
        json: async () => ({ resourceType: "Bundle" }),
      };

      mockFetch
        .mockResolvedValueOnce(mockWellKnownResponse as never)
        .mockResolvedValueOnce(mockTokenResponse as never)
        .mockResolvedValueOnce(mockPatientResponse as never);

      const config: FhirServerConfig = {
        id: "test",
        name: "Test Server",
        hostname: "https://mtls.example.com/fhir",
        disableCertValidation: false,
        defaultServer: false,
        authType: "SMART",
        clientId: "test-client",
        scopes: "system/*.read",
      };

      const client = new FHIRClient(config);

      // This should trigger token endpoint discovery
      await client.get("/Patient");

      // Verify the well-known endpoint was queried to discover the token
      // endpoint, and the discovered endpoint was then used for the token
      // request.
      expect(mockFetch).toHaveBeenCalledWith(
        "https://mtls.example.com/fhir/.well-known/smart-configuration",
        expect.objectContaining({ method: "GET" }),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        "https://mtls.example.com/auth/token",
        expect.objectContaining({ method: "POST" }),
      );

      consoleSpy.mockRestore();
    });
  });
});
