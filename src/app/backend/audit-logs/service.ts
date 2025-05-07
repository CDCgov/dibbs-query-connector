"use server";

import dbService from "../db/client";

export type LogEntry = {
  actionType: string;
  auditChecksum: string;
  author: string;
  auditMessage: { [argLabel: string]: string };
  createdAt: Date;
};

class AuditLogService {
  static async getAuditLogs() {
    const auditQuery = "SELECT * FROM audit_logs ORDER BY created_at DESC;";
    const results = await dbService.query(auditQuery);
    return results.rows;
  }
}

export const getAuditLogs = AuditLogService.getAuditLogs;
