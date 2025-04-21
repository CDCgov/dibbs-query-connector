import dbService from "@/app/backend/dbServices/db-service";
import { suppressConsoleLogs } from "./fixtures";
import {
  FHIR_SERVER_INSERT_QUERY,
  getFhirServerConfigs,
} from "@/app/backend/dbServices/fhir-servers";

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
  it("passing in refresh grabs new values", async () => {
    const fhirServers = await getFhirServerConfigs();
    expect(fhirServers.length).toBe(DEFAULT_FHIR_SERVER_LENGTH);

    await dbService.query(FHIR_SERVER_INSERT_QUERY, [
      TEST_FHIR_SERVER.name,
      TEST_FHIR_SERVER.hostname,
      new Date(),
      TEST_FHIR_SERVER.lastConnectionSuccessful,
      {},
      TEST_FHIR_SERVER.disableCertValidation,
      "none",
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    // Has seeded Aidbox
    const newFhirServers = await getFhirServerConfigs(true);
    expect(newFhirServers.length).toBe(DEFAULT_FHIR_SERVER_LENGTH + 1);
    const newServer = newFhirServers.find(
      (v) => v.name === TEST_FHIR_SERVER.name,
    );
    expect(newServer?.name).toBe(TEST_FHIR_SERVER.name);
    expect(newServer?.hostname).toBe(TEST_FHIR_SERVER.hostname);
    expect(newServer?.authType).toBe("none");

    try {
      await dbService.query(
        `
            DELETE FROM fhir_servers 
            WHERE name = $1
            RETURNING *;
          `,
        [TEST_FHIR_SERVER.name],
      );
    } catch (error) {
      console.error("Teardown failed:", error);
    }
  });
});
