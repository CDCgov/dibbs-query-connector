"use server";
import dbService from "./db-service";

export type LogEntry = {
  actionType: string;
  auditChecksum: string;
  author: string;
  auditMessage: { [argLabel: string]: string };
  createdAt: Date;
  firstName: string;
  lastName: string;
};

class AuditLogService extends dbService {
  static async getAuditLogs() {
    const auditQuery = `
      SELECT 
        audit_logs.action_type,
        audit_logs.audit_checksum,
        audit_logs.author,
        audit_logs.audit_message,
        audit_logs.created_at,
        users.first_name,
        users.last_name
      FROM audit_logs
      LEFT JOIN users ON users.username::TEXT = audit_logs.author
      ORDER BY audit_logs.created_at DESC;
    `;

    const results = await dbService.query(auditQuery);
    return results.rows;
  }
}

export const getAuditLogs = AuditLogService.getAuditLogs;
