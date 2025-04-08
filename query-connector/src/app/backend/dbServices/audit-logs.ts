"use server";
import dbService from "./db-service";

export type LogEntry = {
  actionType: string;
  auditChecksum: string;
  author: string;
  auditMessage: { [argLabel: string]: string };
  createdAt: Date;
};

class AuditLogService extends dbService {
  static async getAuditLogs() {
    const auditQuery = "SELECT * FROM audit_logs ORDER BY created_at DESC;";

    const results = await dbService.query(auditQuery);
    return results.rows;
  }
}

export const getAuditLogs = AuditLogService.getAuditLogs;
