import dbService from "@/app/backend/dbServices/db-service";
import {
  logSignInToAuditTable,
  signOut,
} from "@/app/backend/session-management";
import {
  GET_ALL_AUDIT_ROWS,
  waitForAuditSuccess,
  getAuditEntry,
  TEST_USER,
} from "./utils";
import * as AuditableDecorators from "@/app/backend/auditLogs/lib";
import { auth } from "@/auth";
import { suppressConsoleLogs } from "../fixtures";

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

describe("sign in and out", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });
  it("sign out should generate an audit entry", async () => {
    const oldAuditIds = (await dbService.query(GET_ALL_AUDIT_ROWS)).rows.map(
      (r) => r.id,
    );
    const actionTypeToCheck = "auditableSignOut";

    await signOut();
    await waitForAuditSuccess(actionTypeToCheck, auditCompletionSpy);
    const auditEntry = await getAuditEntry(actionTypeToCheck, oldAuditIds);

    const userInfo = JSON.parse(auditEntry?.sessionParams).session.user;
    expect(userInfo.username).toBe(TEST_USER.user.username);
    expect(userInfo.firstName).toBe(TEST_USER.user.firstName);
    expect(userInfo.lastName).toBe(TEST_USER.user.lastName);
  });

  it("sign in should generate an audit entry", async () => {
    const oldAuditIds = (await dbService.query(GET_ALL_AUDIT_ROWS)).rows.map(
      (r) => r.id,
    );
    const actionTypeToCheck = "auditableSignIn";

    await logSignInToAuditTable({
      preferred_username: TEST_USER.user.username,
      given_name: TEST_USER.user.firstName,
      family_name: TEST_USER.user.lastName,
    });
    await waitForAuditSuccess(actionTypeToCheck, auditCompletionSpy);
    const auditEntry = await getAuditEntry(actionTypeToCheck, oldAuditIds);

    const userInfo = JSON.parse(auditEntry?.profile);
    expect(userInfo.preferredUsername).toBe(TEST_USER.user.username);
    expect(userInfo.givenName).toBe(TEST_USER.user.firstName);
    expect(userInfo.familyName).toBe(TEST_USER.user.lastName);
  });
});
