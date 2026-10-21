import { DbService } from "@/app/backend/db/service";
import { UserRole } from "@/app/models/entities/users";
import { waitFor } from "@testing-library/dom";

export const GET_ALL_AUDIT_ROWS =
  "SELECT * FROM audit_logs WHERE action_type = $1 AND author = $2 ORDER BY created_at DESC LIMIT 1;";

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
    qcRole: UserRole.SUPER_ADMIN,
  },
};

export async function getAuditEntry(
  actionTypeToCheck: string,
  author: string = TEST_USER.user.username,
): Promise<Record<string, Record<string, string>>> {
  const dbService = new DbService();
  // The @auditable decorator writes audit rows asynchronously (fire-and-forget),
  // so the row may not be present the instant the action returns. Poll until the
  // matching entry appears rather than reading once and racing the write.
  return waitFor(
    async () => {
      const newAuditRows = await dbService.query(GET_ALL_AUDIT_ROWS, [
        actionTypeToCheck,
        author,
      ]);

      const auditEntry = newAuditRows.rows[0];
      expect(auditEntry).toBeDefined();
      return auditEntry as Record<string, Record<string, string>>;
    },
    { timeout: 5000 },
  );
}
