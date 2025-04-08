"use server";

import { Pool } from "pg";
import { getDbClient } from "../dbClient";

export type LogEntry = {
  actionType: string;
  auditChecksum: string;
  author: string;
  auditMessage: { [argLabel: string]: string };
  createdAt: Date;
};

class AuditLogService {
  private static dbClient: Pool = getDbClient();

  static async getAuditLogs() {
    const auditQuery = "SELECT * FROM audit_logs ORDER BY created_at DESC;";

    const results = await AuditLogService.dbClient.query(auditQuery);
    return results.rows.map((v) => {
      const val: Record<string, unknown> = {};
      Object.entries(v).forEach(([k, v]) => {
        val[underscoreToCamelCase(k)] = v;
      });

      return val as LogEntry;
    });
  }
}

export const getAuditLogs = AuditLogService.getAuditLogs;

function underscoreToCamelCase(str: string) {
  return str.replace(/_+([a-z])/g, function (match, letter) {
    return letter.toUpperCase();
  });
}
