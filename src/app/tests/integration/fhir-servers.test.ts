import dbService from "@/app/backend/db/service";
import { suppressConsoleLogs } from "./fixtures";

import { FHIR_SERVER_INSERT_QUERY } from "@/app/backend/db/util";
import {
  getFhirServerConfigs,
  updateFhirServer,
  deleteFhirServer,
  insertFhirServer,
} from "@/app/backend/fhir-servers/service";

jest.mock("@/app/utils/auth", () => {
  return {
    superAdminAccessCheck: jest.fn().mockResolvedValue(true),
    adminAccessCheck: jest.fn().mockResolvedValue(true),
  };
});

const TEST_FHIR_SERVER = {
  name: "Kongo Jungle",
  hostname: "http://welcome-to-the-jungle.bananarepublic/fhir",
  headers: null,
  lastConnectionSuccessful: true,
  disableCertValidation: false,
  defaultServer: false,
};

const DEFAULT_FHIR_SERVER_LENGTH = 10;

describe("FHIR Servers tests", () => {
  beforeAll(async () => {
    suppressConsoleLogs();
  });

  it("getter function grabs expected information", async () => {
    const fhirServers = await getFhirServerConfigs();

    // Check for presence of fixture Aidbox
    const aidbox = fhirServers.find((v) => v.name === "Aidbox");
    expect(aidbox).toBeDefined();
    expect(aidbox?.name).toBe("Aidbox");
    expect(aidbox?.hostname).toBe(`${process.env.AIDBOX_BASE_URL}/fhir`);
  });

  it("refresh, update, and deletion functions work", async () => {
    await dbService.query(FHIR_SERVER_INSERT_QUERY, [
      TEST_FHIR_SERVER.name,
      TEST_FHIR_SERVER.hostname,
      new Date(),
      TEST_FHIR_SERVER.lastConnectionSuccessful,
      {},
      TEST_FHIR_SERVER.disableCertValidation,
      TEST_FHIR_SERVER.defaultServer,
      "none",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      false, // mutual_tls parameter
    ]);
    // Has new
    let newFhirServers = await getFhirServerConfigs(true);
    expect(newFhirServers.length).toBe(DEFAULT_FHIR_SERVER_LENGTH + 1);
    const newServer = newFhirServers.find(
      (v) => v.name === TEST_FHIR_SERVER.name,
    );
    expect(newServer?.name).toBe(TEST_FHIR_SERVER.name);
    expect(newServer?.hostname).toBe(TEST_FHIR_SERVER.hostname);
    expect(newServer?.authType).toBe("none");

    //update works
    const NEW_NAME = "Kongo Jungle Two";
    const NEW_HOSTNAME = "http://welcome-to-the-new-jungle.bananarepublic/fhir";
    await updateFhirServer({
      id: newServer?.id as string,
      name: NEW_NAME,
      hostname: NEW_HOSTNAME,
      disableCertValidation: false,
      mutualTls: false,
      defaultServer: false,
      authData: {
        authType: "none",
      },
    });
    newFhirServers = await getFhirServerConfigs(true);
    const shouldBeUpdated = newFhirServers.find((v) => v.name === NEW_NAME);
    expect(shouldBeUpdated?.name).toBe(NEW_NAME);
    expect(shouldBeUpdated?.hostname).toBe(NEW_HOSTNAME);

    // deletion works
    await deleteFhirServer(newServer?.id as string);
    newFhirServers = await getFhirServerConfigs(true);
    const shouldBeDeleted = newFhirServers.find((v) => v.id === newServer?.id);
    expect(shouldBeDeleted).toBeUndefined();
  });

  describe("Custom headers functionality", () => {
    it("should insert a FHIR server with custom headers", async () => {
      const customHeaders = {
        "X-Custom-Header": "test-value",
        "X-Another-Header": "another-value",
        "X-Organization-Id": "org-123",
      };

      const result = await insertFhirServer(
        "Test Server With Headers",
        "http://test-server.com/fhir",
        false,
        false,
        false,
        true,
        {
          authType: "none",
          headers: customHeaders,
        },
      );

      expect(result.success).toBe(true);
      expect(result.server).toBeDefined();

      const servers = await getFhirServerConfigs(true);
      const insertedServer = servers.find(
        (s) => s.name === "Test Server With Headers",
      );

      expect(insertedServer).toBeDefined();
      expect(insertedServer?.headers).toEqual(customHeaders);

      // Cleanup
      if (insertedServer?.id) {
        await deleteFhirServer(insertedServer.id);
      }
    });

    it("should handle custom headers with basic auth", async () => {
      const customHeaders = {
        "X-Custom-Header": "test-value",
        Authorization: "should-be-removed", // This should be removed
      };

      const result = await insertFhirServer(
        "Test Server Basic Auth",
        "http://test-basic-auth.com/fhir",
        false,
        false,
        false,
        true,
        {
          authType: "basic",
          bearerToken: "test-token-123",
          headers: customHeaders,
        },
      );

      expect(result.success).toBe(true);

      const servers = await getFhirServerConfigs(true);
      const insertedServer = servers.find(
        (s) => s.name === "Test Server Basic Auth",
      );

      expect(insertedServer).toBeDefined();
      expect(insertedServer?.headers).toBeDefined();
      expect(insertedServer?.headers?.["X-Custom-Header"]).toBe("test-value");
      expect(insertedServer?.headers?.["Authorization"]).toBe(
        "Bearer test-token-123",
      );
      expect(Object.keys(insertedServer?.headers || {}).length).toBe(2);

      // Cleanup
      if (insertedServer?.id) {
        await deleteFhirServer(insertedServer.id);
      }
    });

    it("should update a FHIR server with new custom headers", async () => {
      // First insert a server
      const insertResult = await insertFhirServer(
        "Test Server For Update",
        "http://test-update.com/fhir",
        false,
        false,
        false,
        true,
        {
          authType: "none",
          headers: {
            "X-Original-Header": "original-value",
          },
        },
      );

      expect(insertResult.success).toBe(true);
      const serverId = insertResult.server.id;

      // Update with new headers
      const newHeaders = {
        "X-Updated-Header": "updated-value",
        "X-New-Header": "new-value",
      };

      const updateResult = await updateFhirServer({
        id: serverId,
        name: "Test Server For Update",
        hostname: "http://test-update.com/fhir",
        disableCertValidation: false,
        mutualTls: false,
        defaultServer: false,
        lastConnectionSuccessful: true,
        authData: {
          authType: "none",
          headers: newHeaders,
        },
      });

      expect(updateResult.success).toBe(true);

      const servers = await getFhirServerConfigs(true);
      const updatedServer = servers.find((s) => s.id === serverId);

      expect(updatedServer?.headers).toEqual(newHeaders);
      expect(updatedServer?.headers?.["X-Original-Header"]).toBeUndefined();

      // Cleanup
      await deleteFhirServer(serverId);
    });

    it("should handle empty headers object", async () => {
      const result = await insertFhirServer(
        "Test Server No Headers",
        "http://test-no-headers.com/fhir",
        false,
        false,
        false,
        true,
        {
          authType: "none",
          headers: {},
        },
      );

      expect(result.success).toBe(true);

      const servers = await getFhirServerConfigs(true);
      const insertedServer = servers.find(
        (s) => s.name === "Test Server No Headers",
      );

      expect(insertedServer).toBeDefined();
      expect(insertedServer?.headers).toEqual({});

      // Cleanup
      if (insertedServer?.id) {
        await deleteFhirServer(insertedServer.id);
      }
    });

    it("should preserve headers when updating other server properties", async () => {
      const customHeaders = {
        "X-Important-Header": "must-preserve",
        "X-Organization": "org-456",
      };

      // Insert server with headers
      const insertResult = await insertFhirServer(
        "Test Server Preserve Headers",
        "http://test-preserve.com/fhir",
        false,
        false,
        false,
        true,
        {
          authType: "none",
          headers: customHeaders,
        },
      );

      const serverId = insertResult.server.id;

      // Update only the URL, headers should be preserved
      const updateResult = await updateFhirServer({
        id: serverId,
        name: "Test Server Preserve Headers",
        hostname: "http://test-preserve-updated.com/fhir",
        disableCertValidation: false,
        mutualTls: false,
        defaultServer: false,
        lastConnectionSuccessful: true,
        authData: {
          authType: "none",
          headers: customHeaders,
        },
      });

      expect(updateResult.success).toBe(true);

      const servers = await getFhirServerConfigs(true);
      const updatedServer = servers.find((s) => s.id === serverId);

      expect(updatedServer?.hostname).toBe(
        "http://test-preserve-updated.com/fhir",
      );
      expect(updatedServer?.headers).toEqual(customHeaders);

      // Cleanup
      await deleteFhirServer(serverId);
    });

    it("should handle client credentials auth with custom headers", async () => {
      const customHeaders = {
        "X-API-Version": "v2",
        "X-Client-Id": "client-app",
      };

      const result = await insertFhirServer(
        "Test Server Client Creds",
        "http://test-client-creds.com/fhir",
        false,
        false,
        false,
        true,
        {
          authType: "client_credentials",
          clientId: "test-client",
          clientSecret: "test-secret",
          tokenEndpoint: "http://test-client-creds.com/token",
          scopes: "system/*.read",
          headers: customHeaders,
        },
      );

      expect(result.success).toBe(true);

      const servers = await getFhirServerConfigs(true);
      const insertedServer = servers.find(
        (s) => s.name === "Test Server Client Creds",
      );

      expect(insertedServer).toBeDefined();
      expect(insertedServer?.authType).toBe("client_credentials");
      expect(insertedServer?.clientId).toBe("test-client");
      expect(insertedServer?.headers).toEqual(customHeaders);
      // Authorization header should not be present for OAuth flows
      expect(insertedServer?.headers?.["Authorization"]).toBeUndefined();

      // Cleanup
      if (insertedServer?.id) {
        await deleteFhirServer(insertedServer.id);
      }
    });

    it("should handle SMART auth with custom headers", async () => {
      const customHeaders = {
        "X-SMART-Version": "1.0",
        "X-Request-Id": "req-123",
      };

      const result = await insertFhirServer(
        "Test Server SMART",
        "http://test-smart.com/fhir",
        false,
        false,
        false,
        true,
        {
          authType: "SMART",
          clientId: "smart-client",
          tokenEndpoint: "http://test-smart.com/auth/token",
          scopes: "patient/*.read",
          headers: customHeaders,
        },
      );

      expect(result.success).toBe(true);

      const servers = await getFhirServerConfigs(true);
      const insertedServer = servers.find(
        (s) => s.name === "Test Server SMART",
      );

      expect(insertedServer).toBeDefined();
      expect(insertedServer?.authType).toBe("SMART");
      expect(insertedServer?.clientId).toBe("smart-client");
      expect(insertedServer?.headers).toEqual(customHeaders);

      // Cleanup
      if (insertedServer?.id) {
        await deleteFhirServer(insertedServer.id);
      }
    });
  });

  it("should insert a FHIR server with patientMatchConfiguration", async () => {
    const matchableServerName = "Test Server With $match";
    const result = await insertFhirServer(
      matchableServerName,
      "http://test-server-match.com/fhir",
      false,
      false,
      false,
      false,
      {
        authType: "none",
      },
      {
        enabled: true,
        onlySingleMatch: false,
        onlyCertainMatches: true,
        matchCount: 5,
        supportsMatch: true,
      },
    );

    expect(result.success).toBe(true);
    expect(result.server).toBeDefined();

    const servers = await getFhirServerConfigs(true);
    const insertedServer = servers.find((s) => s.name === matchableServerName);

    expect(insertedServer).toBeDefined();
    expect(insertedServer?.patientMatchConfiguration).toMatchObject({
      enabled: true,
      onlySingleMatch: false,
      onlyCertainMatches: true,
      matchCount: 5,
      supportsMatch: true,
    });

    // Cleanup
    if (insertedServer?.id) {
      await deleteFhirServer(insertedServer.id);
    }
  });
});
