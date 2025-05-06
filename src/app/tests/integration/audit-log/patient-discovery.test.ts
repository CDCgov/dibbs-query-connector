import { auth } from "@/auth";
import { hyperUnluckyPatient, USE_CASE_DETAILS } from "@/app/shared/constants";
import {
  patientDiscoveryQuery,
  patientRecordsQuery,
} from "@/app/backend/query-execution";
import { suppressConsoleLogs } from "../fixtures";
import { DEFAULT_CHLAMYDIA_QUERY } from "../../unit/fixtures";
import {
  PatientDiscoveryRequest,
  PatientRecordsRequest,
} from "@/app/models/entities/query";
import dbService from "@/app/backend/dbServices/db-service";
import {
  logSignInToAuditTable,
  signOut,
} from "@/app/backend/session-management";
import * as AuditableDecorators from "@/app/backend/auditLogs/lib";
import {
  GET_ALL_AUDIT_ROWS,
  getAuditEntry,
  TEST_USER,
  waitForAuditSuccess,
} from "./utils";

jest.mock("@/app/utils/auth", () => {
  return {
    superAdminAccessCheck: jest.fn(() => Promise.resolve(true)),
    adminAccessCheck: jest.fn(() => Promise.resolve(true)),
  };
});

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

describe("patient queries", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });

  it("patient discovery query should generate an audit entry", async () => {
    const allAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS);
    const oldAuditIds = allAuditRows.rows.map((r) => r.id);
    const actionTypeToCheck = "makePatientDiscoveryRequest";

    const request: PatientDiscoveryRequest = {
      fhirServer: "Aidbox",
      firstName: hyperUnluckyPatient.FirstName,
      lastName: hyperUnluckyPatient.LastName,
      dob: hyperUnluckyPatient.DOB,
      mrn: hyperUnluckyPatient.MRN,
      phone: hyperUnluckyPatient.Phone,
    };
    await patientDiscoveryQuery(request);
    await waitForAuditSuccess(actionTypeToCheck, auditCompletionSpy);
    const auditEntry = await getAuditEntry(actionTypeToCheck, oldAuditIds);

    expect(auditEntry?.actionType).toBe(actionTypeToCheck);
    expect(auditEntry?.auditMessage).toStrictEqual({
      request: JSON.stringify(request),
    });
  });

  it("patient records query should generate an audit entry", async () => {
    const allAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS);
    const oldAuditIds = allAuditRows.rows.map((r) => r.id);
    const actionTypeToCheck = "makePatientRecordsRequest";

    const request: PatientRecordsRequest = {
      fhirServer: "Aidbox",
      patientId: hyperUnluckyPatient.Id,
      queryName: USE_CASE_DETAILS.chlamydia.queryName,
    };
    await patientRecordsQuery(request);
    await waitForAuditSuccess(actionTypeToCheck, auditCompletionSpy);
    const auditEntry = await getAuditEntry(actionTypeToCheck, oldAuditIds);

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
});

describe("sign in and out", () => {
  it("sign out should generate an audit entry", async () => {
    const allAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS);
    const oldAuditIds = allAuditRows.rows.map((r) => r.id);
    const actionTypeToCheck = "auditableSignOut";

    await signOut();
    await waitForAuditSuccess(actionTypeToCheck, auditCompletionSpy);
    const auditEntry = await getAuditEntry(actionTypeToCheck, oldAuditIds);

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
    const actionTypeToCheck = "auditableSignIn";

    await logSignInToAuditTable({
      preferred_username: TEST_USER.user.username,
      given_name: TEST_USER.user.firstName,
      family_name: TEST_USER.user.lastName,
    });
    await waitForAuditSuccess(actionTypeToCheck, auditCompletionSpy);
    const auditEntry = await getAuditEntry(actionTypeToCheck, oldAuditIds);

    const userInfo = JSON.parse(auditEntry?.auditMessage?.profile);

    expect(auditEntry?.actionType).toBe(actionTypeToCheck);
    expect(userInfo.preferredUsername).toBe(TEST_USER.user.username);
    expect(userInfo.givenName).toBe(TEST_USER.user.firstName);
    expect(userInfo.familyName).toBe(TEST_USER.user.lastName);
  });
});
