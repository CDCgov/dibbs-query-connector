import dbService from "@/app/backend/db/service";
import { signOut } from "@/app/backend/session-management";
import { logSignInToAuditTable } from "@/app/backend/auth/sign-in-audit";
import { getAuditEntry, TEST_USER } from "./utils";
import { auth } from "@/auth";
import { suppressConsoleLogs } from "../fixtures";

(auth as jest.Mock).mockResolvedValue(TEST_USER);

describe("sign in and out", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });

  beforeEach(async () => {
    await dbService.query("TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE");
  });

  it("sign out should generate an audit entry", async () => {
    const actionTypeToCheck = "auditableSignOut";

    await signOut();

    const auditEntry = await getAuditEntry(actionTypeToCheck);
    expect(auditEntry?.actionType).toBe(actionTypeToCheck);

    const userInfo = JSON.parse(auditEntry?.auditMessage?.sessionParams).session
      .user;
    expect(userInfo.username).toBe(TEST_USER.user.username);
    expect(userInfo.firstName).toBe(TEST_USER.user.firstName);
    expect(userInfo.lastName).toBe(TEST_USER.user.lastName);
  });

  it("sign in should generate an audit entry", async () => {
    const actionTypeToCheck = "auditableSignIn";

    await logSignInToAuditTable({
      preferred_username: TEST_USER.user.username,
      given_name: TEST_USER.user.firstName,
      family_name: TEST_USER.user.lastName,
    });

    const auditEntry = await getAuditEntry(actionTypeToCheck);
    expect(auditEntry?.actionType).toBe(actionTypeToCheck);

    const userInfo = JSON.parse(auditEntry?.auditMessage?.profile);
    expect(userInfo.preferredUsername).toBe(TEST_USER.user.username);
    expect(userInfo.givenName).toBe(TEST_USER.user.firstName);
    expect(userInfo.familyName).toBe(TEST_USER.user.lastName);
  });
});
