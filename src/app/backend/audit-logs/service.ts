"use server";

import type {
  AuditLogFilterParams,
  QCPagedResponse,
} from "@/app/models/responses/collections";
import dbService from "../db/service";
import { superAdminRequired } from "../db/decorators";

export type LogEntry = {
  actionType: string;
  auditChecksum: string;
  author: string;
  auditMessage: { [argLabel: string]: string };
  createdAt: Date;
};

/**
 * Converts a naive-UTC timestamp from the DB into a Date that parses
 * consistently across browsers and timezones.
 * @param createdAt - The raw created_at value from the DB.
 * @returns The value as a UTC Date.
 */
function normalizeCreatedAt(createdAt: unknown): Date {
  let str = String(createdAt).trim();
  if (createdAt instanceof Date) {
    str = createdAt.toISOString();
  }

  if (!str.includes("T")) str = str.replace(" ", "T");
  if (!str.endsWith("Z")) str += "Z";

  return new Date(str);
}

class AuditLogService {
  /**
   * Retrieves a paginated, filtered list of audit log entries.
   * @param params - Pagination and filter parameters.
   * @returns A paged response of audit log entries, newest first.
   */
  @superAdminRequired
  static async getAuditLogsPaginated(
    params: AuditLogFilterParams,
  ): Promise<QCPagedResponse<LogEntry>> {
    try {
      const conditions: string[] = [];
      const values: (string | number | string[])[] = [];
      let paramIndex = 1;

      if (params.author) {
        conditions.push(`al.author = $${paramIndex}`);
        values.push(params.author);
        paramIndex++;
      }

      if (params.actionType) {
        conditions.push(`al.action_type = $${paramIndex}`);
        values.push(params.actionType);
        paramIndex++;
      }

      if (params.startDate) {
        conditions.push(`al.created_at >= $${paramIndex}::timestamp`);
        values.push(params.startDate);
        paramIndex++;
      }

      if (params.endDate) {
        conditions.push(`al.created_at <= $${paramIndex}::timestamp`);
        values.push(params.endDate);
        paramIndex++;
      }

      if (params.textSearch) {
        const searchClauses = [
          `al.author ILIKE $${paramIndex}`,
          `u.first_name || ' ' || u.last_name ILIKE $${paramIndex}`,
          `al.action_type ILIKE $${paramIndex}`,
          `al.audit_message::text ILIKE $${paramIndex}`,
        ];
        values.push(`%${params.textSearch}%`);
        paramIndex++;

        if (
          params.searchedActionTypes &&
          params.searchedActionTypes.length > 0
        ) {
          searchClauses.push(`al.action_type = ANY($${paramIndex}::text[])`);
          values.push(params.searchedActionTypes);
          paramIndex++;
        }

        conditions.push(`(${searchClauses.join(" OR ")})`);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const fromClause = `
        FROM audit_logs al
        LEFT JOIN users u ON al.author = u.username
      `;

      const countSql = `SELECT COUNT(*) as total ${fromClause} ${whereClause}`;
      const countResult = await dbService.query(countSql, values);
      const totalItems = parseInt(countResult.rows[0].total, 10);

      const offset = params.pageIndex * params.pageSize;
      const dataSql = `
        SELECT al.id, al.author, al.action_type, al.audit_checksum,
          al.audit_message, al.created_at
        ${fromClause}
        ${whereClause}
        ORDER BY al.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const dataResult = await dbService.query(dataSql, [
        ...values,
        params.pageSize,
        offset,
      ]);

      const items: LogEntry[] = dataResult.rows.map((row) => ({
        actionType: row.actionType,
        auditChecksum: row.auditChecksum,
        author: row.author,
        auditMessage: row.auditMessage,
        createdAt: normalizeCreatedAt(row.createdAt),
      }));

      const totalPages = Math.ceil(totalItems / params.pageSize);

      return {
        items,
        totalItems,
        pageIndex: params.pageIndex,
        pageSize: params.pageSize,
        totalPages,
        prevPage: Math.max(0, params.pageIndex - 1),
        nextPage: Math.min(totalPages - 1, params.pageIndex + 1),
      };
    } catch (error) {
      console.error("Error retrieving paginated audit logs:", error);
      throw error;
    }
  }

  /**
   * Retrieves the distinct authors (usernames) across all audit log entries.
   * @returns A sorted list of unique author usernames.
   */
  @superAdminRequired
  static async getAuditLogAuthors(): Promise<string[]> {
    try {
      const sql = `SELECT DISTINCT author FROM audit_logs ORDER BY author ASC`;
      const result = await dbService.query(sql);
      return result.rows
        .map((row) => row.author)
        .filter((author): author is string => !!author);
    } catch (error) {
      console.error("Error retrieving audit log authors:", error);
      throw error;
    }
  }

  /**
   * Retrieves the distinct action types across all audit log entries.
   * @returns A sorted list of unique action types.
   */
  @superAdminRequired
  static async getAuditLogActionTypes(): Promise<string[]> {
    try {
      const sql = `SELECT DISTINCT action_type FROM audit_logs ORDER BY action_type ASC`;
      const result = await dbService.query(sql);
      return result.rows
        .map((row) => row.actionType)
        .filter((actionType): actionType is string => !!actionType);
    } catch (error) {
      console.error("Error retrieving audit log action types:", error);
      throw error;
    }
  }
}

export const getAuditLogsPaginated = AuditLogService.getAuditLogsPaginated;
export const getAuditLogAuthors = AuditLogService.getAuditLogAuthors;
export const getAuditLogActionTypes = AuditLogService.getAuditLogActionTypes;
