import dbService from "@/app/backend/dbServices/db-service";
import {
  insertFhirServer,
  updateFhirServer,
  deleteFhirServer,
} from "@/app/backend/dbServices/fhir-servers";
import { auth } from "@/auth";
import { GET_ALL_AUDIT_ROWS, waitForAuditSuccess } from "./utils";

// don't export / reuse this test user elsewhere since we're filtering
// the audit entry results off this user's authorship. Otherwise, the
// selection from the audit entry table is susceptible to race condition issues
const TEST_USER = {
  user: {
    id: "13e1efb2-5889-4157-8f34-78d7f02dbf84",
    username: "bowserjr",
    email: "bowser.jr@koopa.evil",
    firstName: "Bowser",
    lastName: "Jr.",
  },
};
(auth as jest.Mock).mockResolvedValue(TEST_USER);

describe("fhir server", () => {
  it("fhir server addition / deletion / update", async () => {
    const TEST_FHIR_SERVER = {
      name: "Jolly Roger Bay",
      hostname: "http://sunken-ship.boats/fhir",
      headers: null,
      lastConnectionSuccessful: true,
      disableCertValidation: false,
      defaultServer: false,
    };
    const allAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS);
    const oldAuditIds = allAuditRows.rows.map((r) => r.id);

    // insert
    const result = await insertFhirServer(
      TEST_FHIR_SERVER.name,
      TEST_FHIR_SERVER.hostname,
      TEST_FHIR_SERVER.disableCertValidation,
      TEST_FHIR_SERVER.defaultServer,
      TEST_FHIR_SERVER.lastConnectionSuccessful,
    );
    const actionTypeToCheck = "insertFhirServer";
    await waitForAuditSuccess(actionTypeToCheck);

    const newAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS);

    const auditResults = newAuditRows.rows.filter((r) => {
      return (
        r.author === TEST_USER.user.username &&
        r.actionType === actionTypeToCheck &&
        !oldAuditIds.includes(r.id)
      );
    });
    const auditEntry = auditResults[0]?.auditMessage;

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
    await waitForAuditSuccess(updateTypeToCheck);

    const updateAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS);
    const updateRows = updateAuditRows.rows.filter((r) => {
      return (
        r.author === TEST_USER.user.username &&
        r.actionType === updateTypeToCheck &&
        !oldAuditIds.includes(r.id)
      );
    });
    const updateAuditEntry = updateRows[0]?.auditMessage;
    expect(JSON.parse(updateAuditEntry.name)).toBe(updateName);

    // delete
    await deleteFhirServer(result.server.id);
    const finalTypeToCheck = "deleteFhirServer";
    await waitForAuditSuccess(finalTypeToCheck);

    const finalAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS);

    const finalAuditResults = finalAuditRows.rows.filter((r) => {
      return (
        r.author === TEST_USER.user.username &&
        r.actionType === finalTypeToCheck &&
        !oldAuditIds.includes(r.id)
      );
    });
    const finalEntry = finalAuditResults[0]?.auditMessage;
    expect(JSON.parse(finalEntry.id)).toBe(result.server.id);
  });
});
