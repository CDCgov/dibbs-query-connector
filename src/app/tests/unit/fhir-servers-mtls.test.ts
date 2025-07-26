import { suppressConsoleLogs } from "../integration/fixtures";
import {
  insertFhirServer,
  updateFhirServer,
  getFhirServerConfigs,
  deleteFhirServer,
} from "@/app/backend/fhir-servers";

jest.mock("@/app/utils/auth", () => {
  return {
    superAdminAccessCheck: jest.fn().mockResolvedValue(true),
    adminAccessCheck: jest.fn().mockResolvedValue(true),
  };
});

describe("FHIR Servers Mutual TLS Tests", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });

  afterEach(async () => {
    // Clean up any test servers created
    const servers = await getFhirServerConfigs(true);
    const testServers = servers.filter((s) => s.name.startsWith("Test mTLS"));
    for (const server of testServers) {
      await deleteFhirServer(server.id);
    }
  });

  describe("Mutual TLS configuration", () => {
    it("should insert a FHIR server with mutual TLS enabled", async () => {
      const result = await insertFhirServer(
        "Test mTLS Server",
        "https://test-mtls.example.com/fhir",
        false,
        true, // mutualTls enabled
        false,
        true,
        {
          authType: "none",
        },
      );

      expect(result.success).toBe(true);
      expect(result.server).toBeDefined();

      const servers = await getFhirServerConfigs(true);
      const insertedServer = servers.find((s) => s.name === "Test mTLS Server");

      expect(insertedServer).toBeDefined();
      expect(insertedServer?.mutualTls).toBe(true);
      expect(insertedServer?.hostname).toBe(
        "https://test-mtls.example.com/fhir",
      );
    });

    it("should update a server to enable mutual TLS", async () => {
      // First insert without mTLS
      const insertResult = await insertFhirServer(
        "Test mTLS Update Server",
        "https://test-update.example.com/fhir",
        false,
        false, // mutualTls disabled
        false,
        true,
        {
          authType: "none",
        },
      );

      expect(insertResult.success).toBe(true);
      const serverId = insertResult.server.id;

      // Update to enable mTLS
      const updateResult = await updateFhirServer(
        serverId,
        "Test mTLS Update Server",
        "https://test-update.example.com/fhir",
        false,
        true, // mutualTls enabled
        false,
        true,
        {
          authType: "none",
        },
      );

      expect(updateResult.success).toBe(true);

      const servers = await getFhirServerConfigs(true);
      const updatedServer = servers.find((s) => s.id === serverId);

      expect(updatedServer?.mutualTls).toBe(true);
    });

    it("should handle mutual TLS with client credentials auth", async () => {
      const result = await insertFhirServer(
        "Test mTLS OAuth Server",
        "https://test-mtls-oauth.example.com/fhir",
        false,
        true, // mutualTls enabled
        false,
        true,
        {
          authType: "client_credentials",
          clientId: "test-client",
          clientSecret: "test-secret",
          tokenEndpoint: "https://test-mtls-oauth.example.com/token",
          scopes: "system/*.read",
        },
      );

      expect(result.success).toBe(true);

      const servers = await getFhirServerConfigs(true);
      const insertedServer = servers.find(
        (s) => s.name === "Test mTLS OAuth Server",
      );

      expect(insertedServer).toBeDefined();
      expect(insertedServer?.mutualTls).toBe(true);
      expect(insertedServer?.authType).toBe("client_credentials");
      expect(insertedServer?.clientId).toBe("test-client");
    });

    it("should handle mutual TLS with SMART auth", async () => {
      const result = await insertFhirServer(
        "Test mTLS SMART Server",
        "https://test-mtls-smart.example.com/fhir",
        false,
        true, // mutualTls enabled
        false,
        true,
        {
          authType: "SMART",
          clientId: "smart-client",
          tokenEndpoint: "https://test-mtls-smart.example.com/auth/token",
          scopes: "patient/*.read",
        },
      );

      expect(result.success).toBe(true);

      const servers = await getFhirServerConfigs(true);
      const insertedServer = servers.find(
        (s) => s.name === "Test mTLS SMART Server",
      );

      expect(insertedServer).toBeDefined();
      expect(insertedServer?.mutualTls).toBe(true);
      expect(insertedServer?.authType).toBe("SMART");
    });

    it("should handle mutual TLS with custom headers", async () => {
      const customHeaders = {
        "X-Organization-Id": "org-123",
        "X-Request-Id": "req-456",
      };

      const result = await insertFhirServer(
        "Test mTLS Headers Server",
        "https://test-mtls-headers.example.com/fhir",
        false,
        true, // mutualTls enabled
        false,
        true,
        {
          authType: "none",
          headers: customHeaders,
        },
      );

      expect(result.success).toBe(true);

      const servers = await getFhirServerConfigs(true);
      const insertedServer = servers.find(
        (s) => s.name === "Test mTLS Headers Server",
      );

      expect(insertedServer).toBeDefined();
      expect(insertedServer?.mutualTls).toBe(true);
      expect(insertedServer?.headers).toEqual(customHeaders);
    });

    it("should preserve mutual TLS setting when updating other properties", async () => {
      // Insert with mTLS enabled
      const insertResult = await insertFhirServer(
        "Test mTLS Preserve Server",
        "https://test-preserve.example.com/fhir",
        false,
        true, // mutualTls enabled
        false,
        true,
        {
          authType: "none",
        },
      );

      const serverId = insertResult.server.id;

      // Update only the URL
      const updateResult = await updateFhirServer(
        serverId,
        "Test mTLS Preserve Server",
        "https://test-preserve-updated.example.com/fhir",
        false,
        true, // mutualTls still enabled
        false,
        true,
        {
          authType: "none",
        },
      );

      expect(updateResult.success).toBe(true);

      const servers = await getFhirServerConfigs(true);
      const updatedServer = servers.find((s) => s.id === serverId);

      expect(updatedServer?.hostname).toBe(
        "https://test-preserve-updated.example.com/fhir",
      );
      expect(updatedServer?.mutualTls).toBe(true);
    });

    it("should handle both SSL disable and mutual TLS together", async () => {
      const result = await insertFhirServer(
        "Test mTLS SSL Disabled Server",
        "https://test-mtls-ssl-disabled.example.com/fhir",
        true, // disableCertValidation
        true, // mutualTls enabled
        false,
        true,
        {
          authType: "none",
        },
      );

      expect(result.success).toBe(true);

      const servers = await getFhirServerConfigs(true);
      const insertedServer = servers.find(
        (s) => s.name === "Test mTLS SSL Disabled Server",
      );

      expect(insertedServer).toBeDefined();
      expect(insertedServer?.mutualTls).toBe(true);
      expect(insertedServer?.disableCertValidation).toBe(true);
    });
  });
});
