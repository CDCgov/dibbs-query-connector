jest.mock("@/app/backend/db/decorators/auth");
jest.mock("@/app/backend/db/decorators/util");
(auth as jest.Mock).mockResolvedValue(TEST_USER);

import { getAuditEntry, TEST_USER } from "./utils";
import { auth } from "@/auth";
import { FhirServerConfig } from "@/app/models/entities/fhir-servers";
import {
  insertFhirServer,
  updateFhirServer,
  deleteFhirServer,
} from "@/app/backend/fhir-servers/service";
import { resetMocksToDefault } from "../mocks";

const TEST_FHIR_SERVER = {
  id: "jolly-roger-bay",
  name: "Jolly Roger Bay",
  hostname: "http://sunken-ship.boats/fhir",
  headers: undefined,
  lastConnectionSuccessful: true,
  disableCertValidation: false,
  defaultServer: false,
  authType: "none",
} as FhirServerConfig;

describe("fhir server", () => {
  let insertionId = "";
  beforeAll(() => {
    // suppressConsoleLogs();
  });

  beforeEach(() => {
    resetMocksToDefault();
    jest.clearAllMocks();
  });

  it("addition", async () => {
    // insert
    const result = await insertFhirServer(
      TEST_FHIR_SERVER.name,
      TEST_FHIR_SERVER.hostname,
      TEST_FHIR_SERVER.disableCertValidation,
      TEST_FHIR_SERVER.defaultServer,
      TEST_FHIR_SERVER.lastConnectionSuccessful,
    );

    expect(result.success).toBe(true);
    insertionId = result.server.id;
    const actionTypeToCheck = "insertFhirServer";
    const auditEntry = await getAuditEntry(actionTypeToCheck);

    expect(JSON.parse(auditEntry.name)).toBe(TEST_FHIR_SERVER.name);
    expect(JSON.parse(auditEntry.hostname)).toBe(TEST_FHIR_SERVER.hostname);
    expect(JSON.parse(auditEntry.lastConnectionSuccessful)).toBe(
      TEST_FHIR_SERVER.lastConnectionSuccessful,
    );
  }, 10000);

  it("update", async () => {
    const updateName = "Dire Dire Docks";
    const updateResult = await updateFhirServer({
      id: insertionId,
      name: updateName,
      hostname: TEST_FHIR_SERVER.hostname,
      defaultServer: false,
      disableCertValidation: TEST_FHIR_SERVER.disableCertValidation,
      lastConnectionSuccessful: false,
      authData: {
        authType: "none",
      },
    });
    const updateTypeToCheck = "updateFhirServer";

    expect(updateResult.success).toBe(true);

    const updateAuditEntry = await getAuditEntry(updateTypeToCheck);
    expect(JSON.parse(updateAuditEntry.updateDetails).name).toBe(updateName);
  }, 10000);

  it("delete", async () => {
    const deleteResult = await deleteFhirServer(insertionId);
    expect(deleteResult.success).toBe(true);

    const deleteTypeToCheck = "deleteFhirServer";
    const finalEntry = await getAuditEntry(deleteTypeToCheck);
    expect(JSON.parse(finalEntry.id)).toBe(insertionId);
  }, 10000);
});
