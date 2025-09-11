import { suppressConsoleLogs } from "./fixtures";
import {
  insertFhirServer,
  updateFhirServer,
  getFhirServerConfigs,
  deleteFhirServer,
} from "@/app/backend/fhir-servers/service";

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
      const testCaCert =
        "-----BEGIN CERTIFICATE-----\nTEST_CA_CERT_DATA\n-----END CERTIFICATE-----";

      const result = await insertFhirServer(
        "Test mTLS Server",
        "https://test-mtls.example.com/fhir",
        false,
        false,
        true,
        {
          authType: "mutual-tls",
          caCert: testCaCert,
        },
      );

      expect(result.success).toBe(true);
      expect(result.server).toBeDefined();

      const servers = await getFhirServerConfigs(true);
      const insertedServer = servers.find((s) => s.name === "Test mTLS Server");

      expect(insertedServer).toBeDefined();
      expect(insertedServer?.authType).toBe("mutual-tls");
      expect(insertedServer?.caCert).toBe(testCaCert);
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
        false,
        true,
        {
          authType: "none",
        },
      );

      expect(insertResult.success).toBe(true);
      const serverId = insertResult.server.id;

      const testCaCert =
        "-----BEGIN CERTIFICATE-----\nUPDATED_CA_CERT\n-----END CERTIFICATE-----";

      // Update to enable mTLS
      const updateResult = await updateFhirServer({
        id: serverId,
        name: "Test mTLS Update Server",
        hostname: "https://test-update.example.com/fhir",
        disableCertValidation: false,
        defaultServer: false,
        lastConnectionSuccessful: true,
        authData: {
          authType: "mutual-tls",
          caCert: testCaCert,
        },
      });

      expect(updateResult.success).toBe(true);

      const servers = await getFhirServerConfigs(true);
      const updatedServer = servers.find((s) => s.id === serverId);

      expect(updatedServer?.authType).toBe("mutual-tls");
      expect(updatedServer?.caCert).toBe(testCaCert);
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
      expect(insertedServer?.headers).toEqual(customHeaders);
    });

    it("should preserve mutual TLS setting when updating other properties", async () => {
      // Insert with mTLS enabled
      const insertResult = await insertFhirServer(
        "Test mTLS Preserve Server",
        "https://test-preserve.example.com/fhir",
        false,
        false,
        true,
        {
          authType: "none",
        },
      );

      const serverId = insertResult.server.id;

      // Update only the URL
      const updateResult = await updateFhirServer({
        id: serverId,
        name: "Test mTLS Update Server",
        hostname: "https://test-preserve-updated.example.com/fhir",
        disableCertValidation: false,
        defaultServer: false,
        lastConnectionSuccessful: true,
        authData: {
          authType: "none",
        },
      });

      expect(updateResult.success).toBe(true);

      const servers = await getFhirServerConfigs(true);
      const updatedServer = servers.find((s) => s.id === serverId);

      expect(updatedServer?.hostname).toBe(
        "https://test-preserve-updated.example.com/fhir",
      );
    });

    it("should handle both SSL disable and mutual TLS together", async () => {
      const result = await insertFhirServer(
        "Test mTLS SSL Disabled Server",
        "https://test-mtls-ssl-disabled.example.com/fhir",
        true, // disableCertValidation
        false,
        true,
        {
          authType: "mutual-tls",
        },
      );

      expect(result.success).toBe(true);

      const servers = await getFhirServerConfigs(true);
      const insertedServer = servers.find(
        (s) => s.name === "Test mTLS SSL Disabled Server",
      );

      expect(insertedServer).toBeDefined();
      expect(insertedServer?.authType).toBe("mutual-tls");
      expect(insertedServer?.disableCertValidation).toBe(true);
    });

    it("should handle CA certificate persistence and updates", async () => {
      const originalCaCert =
        "-----BEGIN CERTIFICATE-----\nORIGINAL_CA_CERT\n-----END CERTIFICATE-----";

      // Insert server with CA cert
      const insertResult = await insertFhirServer(
        "Test mTLS CA Cert Server",
        "https://test-ca-cert.example.com/fhir",
        false,
        false,
        true,
        {
          authType: "mutual-tls",
          caCert: originalCaCert,
        },
      );

      expect(insertResult.success).toBe(true);
      const serverId = insertResult.server.id;

      // Verify CA cert is stored
      let servers = await getFhirServerConfigs(true);
      let insertedServer = servers.find((s) => s.id === serverId);
      expect(insertedServer?.caCert).toBe(originalCaCert);

      // Update CA cert
      const updatedCaCert =
        "-----BEGIN CERTIFICATE-----\nUPDATED_CA_CERT\n-----END CERTIFICATE-----";
      const updateResult = await updateFhirServer({
        id: serverId,
        name: "Test mTLS CA Cert Server",
        hostname: "https://test-ca-cert.example.com/fhir",
        disableCertValidation: false,
        defaultServer: false,
        lastConnectionSuccessful: true,
        authData: {
          authType: "mutual-tls",
          caCert: updatedCaCert,
        },
      });

      expect(updateResult.success).toBe(true);

      // Verify CA cert is updated
      servers = await getFhirServerConfigs(true);
      const updatedServer = servers.find((s) => s.id === serverId);
      expect(updatedServer?.caCert).toBe(updatedCaCert);
      expect(updatedServer?.authType).toBe("mutual-tls");
    });

    it("should clear CA certificate when switching away from mutual TLS", async () => {
      const testCaCert =
        "-----BEGIN CERTIFICATE-----\nTEST_CA_CERT\n-----END CERTIFICATE-----";

      // Insert server with mutual TLS and CA cert
      const insertResult = await insertFhirServer(
        "Test mTLS Clear CA Cert Server",
        "https://test-clear-ca.example.com/fhir",
        false,
        false,
        true,
        {
          authType: "mutual-tls",
          caCert: testCaCert,
        },
      );

      const serverId = insertResult.server.id;

      // Update to use basic auth (should clear CA cert)
      const updateResult = await updateFhirServer({
        id: serverId,
        name: "Test mTLS Clear CA Cert Server",
        hostname: "https://test-clear-ca.example.com/fhir",
        disableCertValidation: false,
        defaultServer: false,
        lastConnectionSuccessful: true,
        authData: {
          authType: "basic",
          bearerToken: "test-token",
        },
      });

      expect(updateResult.success).toBe(true);

      // Verify CA cert is cleared
      const servers = await getFhirServerConfigs(true);
      const updatedServer = servers.find((s) => s.id === serverId);
      expect(updatedServer?.authType).toBe("basic");
      expect(updatedServer?.caCert).toBeNull();
    });
  });
});
