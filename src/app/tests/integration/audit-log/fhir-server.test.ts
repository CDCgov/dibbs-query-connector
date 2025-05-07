import dbService from "@/app/backend/db/client";
import {
  insertFhirServer,
  updateFhirServer,
  deleteFhirServer,
} from "@/app/backend/dbServices/fhir-servers";
import { auth } from "@/auth";
import {
  GET_ALL_AUDIT_ROWS,
  getAuditEntry,
  TEST_USER,
  waitForAuditSuccess,
} from "./utils";
import * as AuditableDecorators from "@/app/backend/auditLogs/lib";
import { suppressConsoleLogs } from "../fixtures";

jest.mock("@/app/backend/auditLogs/lib", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@/app/backend/auditLogs/lib"),
  };
});
const auditCompletionSpy = jest.spyOn(
  AuditableDecorators,
  "generateAuditSuccessMessage",
);
(auth as jest.Mock).mockResolvedValue(TEST_USER);

describe("fhir server", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });
  it("fhir server addition / deletion / update", async () => {
    const TEST_FHIR_SERVER = {
      name: "Jolly Roger Bay",
      hostname: "http://sunken-ship.boats/fhir",
      headers: null,
      lastConnectionSuccessful: true,
      disableCertValidation: false,
      defaultServer: false,
    };
    const oldAuditIds = (await dbService.query(GET_ALL_AUDIT_ROWS)).rows.map(
      (r) => r.id,
    );

    // insert
    const result = await insertFhirServer(
      TEST_FHIR_SERVER.name,
      TEST_FHIR_SERVER.hostname,
      TEST_FHIR_SERVER.disableCertValidation,
      TEST_FHIR_SERVER.defaultServer,
      TEST_FHIR_SERVER.lastConnectionSuccessful,
    );
    const actionTypeToCheck = "insertFhirServer";
    await waitForAuditSuccess(actionTypeToCheck, auditCompletionSpy);

    const auditEntry = await getAuditEntry(actionTypeToCheck, oldAuditIds);

    expect(JSON.parse(auditEntry.name)).toBe(TEST_FHIR_SERVER.name);
    expect(JSON.parse(auditEntry.hostname)).toBe(TEST_FHIR_SERVER.hostname);
    expect(JSON.parse(auditEntry.lastConnectionSuccessful)).toBe(
      TEST_FHIR_SERVER.lastConnectionSuccessful,
    );

    // update
    const updateName = "Dire Dire Docks";
    await updateFhirServer(
      result.server.id,
      updateName,
      TEST_FHIR_SERVER.hostname,
      TEST_FHIR_SERVER.disableCertValidation,
      false,
    );
    const updateTypeToCheck = "updateFhirServer";
    await waitForAuditSuccess(updateTypeToCheck, auditCompletionSpy);
    const updateAuditEntry = await getAuditEntry(
      updateTypeToCheck,
      oldAuditIds,
    );

    expect(JSON.parse(updateAuditEntry.name)).toBe(updateName);

    // delete
    await deleteFhirServer(result.server.id);
    const finalTypeToCheck = "deleteFhirServer";
    await waitForAuditSuccess(finalTypeToCheck, auditCompletionSpy);

    const finalEntry = await getAuditEntry(finalTypeToCheck, oldAuditIds);
    expect(JSON.parse(finalEntry.id)).toBe(result.server.id);
  });
});
