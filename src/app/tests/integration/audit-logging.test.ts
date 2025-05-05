import { auth } from "@/auth";
import { hyperUnluckyPatient, USE_CASE_DETAILS } from "@/app/shared/constants";
import {
  patientDiscoveryQuery,
  patientRecordsQuery,
} from "@/app/backend/query-execution";
import {
  AUDIT_LOG_MAX_RETRIES,
  auditable,
} from "@/app/backend/auditLogs/decorator";
import * as DecoratorUtils from "@/app/backend/auditLogs/lib";
import { suppressConsoleLogs } from "./fixtures";
import { DEFAULT_CHLAMYDIA_QUERY } from "../unit/fixtures";
import {
  PatientDiscoveryRequest,
  PatientRecordsRequest,
} from "@/app/models/entities/query";
import dbService from "@/app/backend/dbServices/db-service";
import { getDbClient } from "@/app/backend/dbClient";
import {
  logSignInToAuditTable,
  signOut,
} from "@/app/backend/session-management";
const dbClient = getDbClient();

jest.mock("@/app/backend/auditLogs/lib", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@/app/backend/auditLogs/lib"),
  };
});

jest.mock("@/app/utils/auth", () => {
  return {
    superAdminAccessCheck: jest.fn(() => Promise.resolve(true)),
    adminAccessCheck: jest.fn(() => Promise.resolve(true)),
  };
});

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

const GET_ALL_AUDIT_ROWS = "SELECT * FROM audit_logs;";
describe("audit log", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });

  it("patient discovery query should generate an audit entry", async () => {
    const allAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS);
    const oldAuditIds = allAuditRows.rows.map((r) => r.id);

    const request: PatientDiscoveryRequest = {
      fhirServer: "Aidbox",
      firstName: hyperUnluckyPatient.FirstName,
      lastName: hyperUnluckyPatient.LastName,
      dob: hyperUnluckyPatient.DOB,
      mrn: hyperUnluckyPatient.MRN,
      phone: hyperUnluckyPatient.Phone,
    };
    await patientDiscoveryQuery(request);

    const actionTypeToCheck = "makePatientDiscoveryRequest";
    const newAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS);
    const auditEntry = newAuditRows.rows.filter((r) => {
      return (
        r.author === TEST_USER.user.username &&
        r.actionType === actionTypeToCheck &&
        !oldAuditIds.includes(r.id)
      );
    })[0];

    expect(auditEntry?.actionType).toBe(actionTypeToCheck);
    expect(auditEntry?.auditMessage).toStrictEqual({
      request: JSON.stringify(request),
    });
  });

  it("patient records query should generate an audit entry", async () => {
    const allAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS);
    const oldAuditIds = allAuditRows.rows.map((r) => r.id);

    const request: PatientRecordsRequest = {
      fhirServer: "Aidbox",
      patientId: hyperUnluckyPatient.Id,
      queryName: USE_CASE_DETAILS.chlamydia.queryName,
    };
    await patientRecordsQuery(request);

    const actionTypeToCheck = "makePatientRecordsRequest";
    const newAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS);
    const auditEntry = newAuditRows.rows.filter((r) => {
      return (
        r.author === TEST_USER.user.username &&
        r.actionType === actionTypeToCheck &&
        !oldAuditIds.includes(r.id)
      );
    })[0];

    expect(auditEntry?.actionType).toBe(actionTypeToCheck);
    expect(JSON.parse(auditEntry?.auditMessage?.fhirServer)).toBe(
      request.fhirServer,
    );
    expect(JSON.parse(auditEntry?.auditMessage?.patientId)).toBe(
      request.patientId,
    );
    expect(JSON.parse(auditEntry?.auditMessage?.queryData)).toStrictEqual(
      DEFAULT_CHLAMYDIA_QUERY.queryData,
    );
  });

  it("sign out should generate an audit entry", async () => {
    const allAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS);
    const oldAuditIds = allAuditRows.rows.map((r) => r.id);

    await signOut();

    const actionTypeToCheck = "auditableSignOut";
    const newAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS);
    const auditEntry = newAuditRows.rows.filter((r) => {
      return (
        r.author === TEST_USER.user.username &&
        r.actionType === actionTypeToCheck &&
        !oldAuditIds.includes(r.id)
      );
    })[0];
    const userInfo = JSON.parse(auditEntry?.auditMessage?.sessionParams).session
      .user;

    expect(auditEntry?.actionType).toBe(actionTypeToCheck);
    expect(userInfo.username).toBe(TEST_USER.user.username);
    expect(userInfo.firstName).toBe(TEST_USER.user.firstName);
    expect(userInfo.lastName).toBe(TEST_USER.user.lastName);
  });

  it("sign in should generate an audit entry", async () => {
    const allAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS);
    const oldAuditIds = allAuditRows.rows.map((r) => r.id);

    await logSignInToAuditTable({
      preferred_username: TEST_USER.user.username,
      given_name: TEST_USER.user.firstName,
      family_name: TEST_USER.user.lastName,
    });

    const actionTypeToCheck = "auditableSignIn";
    const newAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS);
    const auditEntry = newAuditRows.rows.filter((r) => {
      return (
        r.author === TEST_USER.user.username &&
        r.actionType === actionTypeToCheck &&
        !oldAuditIds.includes(r.id)
      );
    })[0];
    const userInfo = JSON.parse(auditEntry?.auditMessage?.profile);

    expect(auditEntry?.actionType).toBe(actionTypeToCheck);
    expect(userInfo.preferred_username).toBe(TEST_USER.user.username);
    expect(userInfo.given_name).toBe(TEST_USER.user.firstName);
    expect(userInfo.family_name).toBe(TEST_USER.user.lastName);
  });

  it("an audited function should retry successfully", async () => {
    const auditGenerationSpy = jest.spyOn(
      DecoratorUtils,
      "generateAuditValues",
    );

    const querySpy = jest.spyOn(dbClient, "query");

    // generate errors within the query write AUDIT_LOG_MAX_RETRIES - 1 times
    for (let i = 0; i < AUDIT_LOG_MAX_RETRIES; i++) {
      querySpy.mockImplementationOnce(() => {
        throw new Error("test error");
      });
    }

    class MockClass {
      @auditable
      testFunction() {
        return;
      }
    }

    const testObj = new MockClass();
    testObj.testFunction();

    await new Promise((r) => setTimeout(r, 6000));
    expect(auditGenerationSpy).toHaveBeenCalledTimes(AUDIT_LOG_MAX_RETRIES);
  }, 10000);

  it("should block UPDATEs and DELETE for audit_logs", async () => {
    const request: PatientDiscoveryRequest = {
      fhirServer: "Aidbox",
      firstName: hyperUnluckyPatient.FirstName,
      lastName: hyperUnluckyPatient.LastName,
      dob: hyperUnluckyPatient.DOB,
      mrn: hyperUnluckyPatient.MRN,
      phone: hyperUnluckyPatient.Phone,
    };

    await patientDiscoveryQuery(request);

    const result = await dbClient.query(
      "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1",
    );
    const insertedId = result.rows[0].id;

    await expect(
      dbClient.query(`UPDATE audit_logs SET author = 'hacker' WHERE id = $1`, [
        insertedId,
      ]),
    ).rejects.toThrow(/UPDATEs to audit_logs are not permitted/i);

    await expect(
      dbClient.query(`DELETE FROM audit_logs WHERE id = $1`, [insertedId]),
    ).rejects.toThrow(/DELETEs from audit_logs are not permitted/i);
  });
});

describe("generateAuditChecksum", () => {
  it("produces correct checksum for audit message with stringified request", () => {
    const author = "WorfSonOfMogh";
    const timestamp = "2024-04-10T17:12:45.123Z";

    const auditMessage = {
      request: JSON.stringify({
        fhir_server: "Aidbox",
        first_name: "Testy",
        last_name: "McTestface",
        dob: "1970-01-01",
        mrn: "1234567",
        phone: "555-123-4567",
      }),
    };

    const checksum = DecoratorUtils.generateAuditChecksum(
      author,
      auditMessage,
      timestamp,
    );

    const expected = require("crypto")
      .createHash("sha256")
      .update(
        JSON.stringify({
          author,
          auditContents: auditMessage,
          timestamp,
        }),
      )
      .digest("hex");

    expect(checksum).toBe(expected);
  });
});
