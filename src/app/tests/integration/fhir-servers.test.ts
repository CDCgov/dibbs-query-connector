import dbService from "@/app/backend/db/service";
import { suppressConsoleLogs } from "./fixtures";

import { FHIR_SERVER_INSERT_QUERY } from "@/app/backend/db/util";
import {
  getFhirServerConfigs,
  updateFhirServer,
  deleteFhirServer,
} from "@/app/backend/fhir-servers";

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
    await updateFhirServer(
      newServer?.id as string,
      NEW_NAME,
      NEW_HOSTNAME,
      false,
      false,
    );
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
});
