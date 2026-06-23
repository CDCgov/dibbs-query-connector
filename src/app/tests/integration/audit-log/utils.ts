import dbService from "@/app/backend/db/service";
import { waitFor } from "@testing-library/dom";

export const GET_ALL_AUDIT_ROWS = "SELECT * FROM audit_logs;";

export async function waitForAuditSuccess(
  actionTypeToCheck: string,
  spy: jest.SpyInstance,
) {
  await waitFor(() => {
    expect(spy).toHaveBeenCalledWith(
      actionTypeToCheck,
      expect.anything(),
      expect.anything(),
    );
  });
}

// don't reuse this test user outside audit log tests since we're filtering
// the audit entry results off this user's authorship. Otherwise, the
// selection from the audit entry table is susceptible to race condition issues
export const TEST_USER = {
  user: {
    id: "13e1efb2-5889-4157-8f34-78d7f02dbf84",
    username: "bowserjr",
    email: "bowser.jr@koopa.evil",
    firstName: "Bowser",
    lastName: "Jr.",
  },
};

export async function getAuditEntry(
  actionTypeToCheck: string,
  oldAuditIds: string[],
) {
  // The @auditable decorator writes audit rows asynchronously (fire-and-forget),
  // so the row may not be present the instant the action returns. Poll until the
  // matching entry appears rather than reading once and racing the write.
  let auditEntry;
  await waitFor(
    async () => {
      const newAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS);
      const auditResults = newAuditRows.rows.filter((r) => {
        return (
          r.author === TEST_USER.user.username &&
          r.actionType === actionTypeToCheck &&
          !oldAuditIds.includes(r.id)
        );
      });
      auditEntry = auditResults[0]?.auditMessage;
      expect(auditEntry).toBeDefined();
    },
    { timeout: 5000 },
  );
  return auditEntry;
}
