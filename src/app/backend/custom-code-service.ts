"use server";

import { adminRequired, transaction } from "@/app/backend/db/decorators";
import { auditable } from "@/app/backend/audit-logs/decorator";
import {
  insertValueSetSql,
  insertConceptSql,
  insertValuesetToConceptSql,
  insertConditionSql,
  insertConditionToValuesetSql,
  insertDemoQueryLogicSql,
} from "./db-creation/seedSqlStructs";
import type { DibbsValueSet } from "../models/entities/valuesets";
import type { Concept } from "../models/entities/concepts";
import { QCResponse } from "../models/responses/collections";
import type {
  QCPagedResponse,
  ValueSetFilterParams,
} from "../models/responses/collections";
import type { QueryDataColumn } from "@/app/(pages)/queryBuilding/utils";
import crypto from "crypto";

import { formatCodeSystemPrefix } from "../utils/format-service";

import { CUSTOM_CONDITION_ID, CUSTOM_VALUESET_ARRAY_ID } from "@/app/constants";
import dbService from "./db/service";

class CustomCodeService {
  // This may not be needed since these are user-created valuesets
  private static getSystemPrefix(system: string) {
    const match = system?.match(/https?:\/\/([^\.]+)/);
    return match ? match[1] : system;
  }

  static async addCustomCodeCondition(system: string): Promise<string> {
    const checkSql = `SELECT id FROM conditions WHERE id = $1`;
    const result = await dbService.query(checkSql, [CUSTOM_CONDITION_ID]);
    if (result.rows.length === 0) {
      await dbService.query(insertConditionSql, [
        CUSTOM_CONDITION_ID,
        system,
        "Custom Code Condition",
        "20250601", // Placeholder, I don't think we really need versioning for this
        "User-Created",
      ]);
    }
    return CUSTOM_CONDITION_ID;
  }

  static async getCustomValueSetById(
    id: string,
  ): Promise<QCResponse<DibbsValueSet>> {
    try {
      const selectValueSetQuery = `
          SELECT c.display, c.code_system, c.code, c.id as internal_id, vs.name as valueset_name, vs.id as valueset_id, vs.oid as valueset_external_id, vs.version, vs.author as author, 
            vs.type, vs.dibbs_concept_type as dibbs_concept_type, vs.user_created, ctvs.condition_id, u.first_name, u.last_name, u.username
          FROM valuesets vs 
          LEFT JOIN condition_to_valueset ctvs on vs.id = ctvs.valueset_id 
          LEFT JOIN valueset_to_concept vstc on vs.id = vstc.valueset_id
          LEFT JOIN concepts c on vstc.concept_id = c.id
          LEFT JOIN users u on vs.author = u.id::text
          WHERE vs.id = $1
          ORDER BY name ASC;
        `;

      const result = await dbService.query(selectValueSetQuery, [id]);

      const vsWithAuthor = result.rows.map((item) => {
        if (item.user_created == true) {
          item.author =
            item.first_name && item.last_name
              ? `${item.first_name} ${item.last_name}`
              : item.username;
          return item;
        }
        return item;
      });
      return {
        totalItems: result.rowCount,
        items: vsWithAuthor,
      } as QCResponse<DibbsValueSet>;
    } catch (error) {
      console.error("Error retrieving user groups:", error);
      throw error;
    }
  }

  @transaction
  @auditable
  static async insertCustomValueSet(
    vs: DibbsValueSet,
    userId: string,
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const errors: string[] = [];
    const uuid = crypto.randomUUID();

    const systemPrefix = vs.system ? formatCodeSystemPrefix(vs.system) : "";
    const valueSetUniqueId =
      vs.valueSetId !== "" ? vs.valueSetId : `${uuid}_${vs.valueSetVersion}`;
    const valueSetOid = vs.valueSetExternalId || uuid;

    // Insert Custom Code Condition if not already present
    const CUSTOM_CONDITION_ID = await CustomCodeService.addCustomCodeCondition(
      vs.system || "",
    );

    // Insert ValueSet
    let newValueSetId = "";
    try {
      const newValueSet = await dbService.query(insertValueSetSql, [
        valueSetUniqueId,
        valueSetOid, // I'm not sure if this is something we need to track
        vs.valueSetVersion, // I'm not sure if this is something we need to track, could be a timestamp or an optional user param for them to track versioning
        vs.valueSetName,
        userId, // should be a user ID of the current user
        vs.ersdConceptType ?? vs.dibbsConceptType,
        vs.dibbsConceptType,
        "true",
      ]);

      newValueSetId = newValueSet.rows[0].id;
    } catch (e) {
      console.error("Insert failed for valueset:", e);
      errors.push("ValueSet insert failed");
    }

    // Insert Concepts and Linkages
    for (const concept of vs.concepts) {
      // TODO: We will need to do an UPDATE display if system prefix and code already exist
      const conceptId =
        concept.internalId ?? `custom_${systemPrefix}_${concept.code}`;
      try {
        await dbService.query(insertConceptSql, [
          conceptId,
          concept.code,
          vs.system,
          concept.display,
        ]);
      } catch (e) {
        console.error("Insert failed for concept:", e);
        errors.push(`Concept insert failed: ${conceptId}`);
      }

      const vstcId = `${valueSetUniqueId}_${conceptId}`;
      try {
        await dbService.query(insertValuesetToConceptSql, [
          vstcId,
          valueSetUniqueId,
          conceptId,
        ]);
      } catch (e) {
        console.error("Insert failed for valueset_to_concept:", e);
        errors.push(`VS↔Concept join failed: ${vstcId}`);
      }
    }

    // Insert condition_to_valueset
    const ctvsId = `${CUSTOM_CONDITION_ID}_${valueSetUniqueId}`;
    try {
      await dbService.query(insertConditionToValuesetSql, [
        ctvsId,
        CUSTOM_CONDITION_ID,
        valueSetUniqueId,
        "User",
      ]);
    } catch (e) {
      console.error("Insert failed for condition_to_valueset:", e);
      errors.push(`Condition↔VS join failed: ${ctvsId}`);
    }

    return errors.length === 0
      ? { success: true, id: newValueSetId }
      : { success: false, error: errors.join(", ") };
  }

  @transaction
  @auditable
  static async deleteCustomValueSet(
    vs: DibbsValueSet,
  ): Promise<{ success: boolean; error?: string }> {
    const errors: string[] = [];

    try {
      const deleteCustomValueSetJoinsQuery = `
      DELETE FROM valueset_to_concept
      WHERE valueset_id = $1
    `;

      await dbService.query(deleteCustomValueSetJoinsQuery, [vs.valueSetId]);

      const deleteConditionToValueSetJoinQuery = `
      DELETE FROM condition_to_valueset
      WHERE valueset_id = $1
      `;
      await dbService.query(deleteConditionToValueSetJoinQuery, [
        vs.valueSetId,
      ]);

      const deleteCustomValueSetQuery = `
      DELETE FROM valuesets
      WHERE id = $1
    `;

      await dbService.query(deleteCustomValueSetQuery, [vs.valueSetId]);
    } catch (e) {
      console.error("Update failed for valueset:", e);
      errors.push("ValueSet update failed");
    }

    return errors.length === 0
      ? { success: true }
      : { success: false, error: errors.join(", ") };
  }

  @transaction
  @auditable
  static async deleteCustomConcept(
    code: Concept,
    vs: DibbsValueSet,
  ): Promise<{ success: boolean; error?: string }> {
    const errors: string[] = [];

    try {
      const deleteCustomConceptQuery = `
      DELETE FROM valueset_to_concept
      WHERE concept_id = $1 and valueset_id = $2
    `;

      let conceptId = code.internalId;
      if (code.internalId == undefined) {
        const systemPrefix = vs.system
          ? CustomCodeService.getSystemPrefix(vs.system)
          : "";
        conceptId = `custom_${systemPrefix}_${code.code}`;
      }

      await dbService.query(deleteCustomConceptQuery, [
        conceptId,
        vs.valueSetId,
      ]);
    } catch (e) {
      console.error("Delete failed for concept-to-valueset:", e);
      errors.push("ValueSet update failed");
    }

    return errors.length === 0
      ? { success: true }
      : { success: false, error: errors.join(", ") };
  }

  // insert or update query_data with a "custom" key containing these valuesets
  // if queryId is undefined, this creates a new query record with custom only
  @transaction
  @auditable
  static async insertCustomValuesetsIntoQuery(
    userId: string,
    customValuesets: DibbsValueSet[],
    queryId?: string,
  ): Promise<{ success: boolean; queryId?: string; error?: string }> {
    try {
      if (queryId) {
        // update existing query
        const querySql = `SELECT query_data FROM query WHERE id = $1`;
        const result = await dbService.query(querySql, [queryId]);

        let queryData: QueryDataColumn = {};
        if (result.rows.length > 0 && result.rows[0].queryData) {
          queryData = result.rows[0].queryData as QueryDataColumn;
        }

        // merge new custom codes into existing custom block, overwriting old with new
        const existingCustomBlock = queryData[CUSTOM_VALUESET_ARRAY_ID] ?? {};

        for (const vs of customValuesets) {
          existingCustomBlock[vs.valueSetId] = vs;
        }

        queryData[CUSTOM_VALUESET_ARRAY_ID] = existingCustomBlock;

        // Update the query_data with the merged custom valuesets
        const updateSql = `UPDATE query SET query_data = $1, date_last_modified = NOW() WHERE id = $2`;
        await dbService.query(updateSql, [queryData, queryId]);
        return { success: true, queryId };
      } else {
        // create a new query with custom only
        const name = `Custom Query ${Math.random()}`;
        const queryData: QueryDataColumn = {
          [CUSTOM_VALUESET_ARRAY_ID]: {},
        };

        for (const vs of customValuesets) {
          queryData[CUSTOM_VALUESET_ARRAY_ID][vs.valueSetId] = vs;
        }
        const NOW_ISO = new Date().toISOString();
        const result = await dbService.query(insertDemoQueryLogicSql, [
          name,
          queryData,
          [],
          userId,
          NOW_ISO,
          NOW_ISO,
        ]);
        const newId = result.rows[0].id;
        if (newId) {
          return { success: true, queryId: newId };
        } else {
          throw Error("No ID returned in query insertion");
        }
      }
    } catch (e) {
      console.error(
        "Failed to insert or update query_data with custom valuesets:",
        e,
      );
      return { success: false, error: String(e) };
    }
  }

  /**
   * Retrieves all available value sets in Query Connector.
   * @returns A list of value sets registered in the query connector.
   */
  @adminRequired
  static async getAllValueSets(): Promise<QCResponse<DibbsValueSet>> {
    try {
      const selectAllVSQuery = `
      SELECT c.display, c.code_system, c.code, c.id as internal_id, vs.name as valueset_name, vs.id as valueset_id, vs.oid as valueset_external_id, vs.version, vs.author as author, 
        vs.type, vs.dibbs_concept_type as dibbs_concept_type, vs.user_created, ctvs.condition_id, u.first_name, u.last_name, u.username
      FROM valuesets vs 
      LEFT JOIN condition_to_valueset ctvs on vs.id = ctvs.valueset_id 
      LEFT JOIN valueset_to_concept vstc on vs.id = vstc.valueset_id
      LEFT JOIN concepts c on vstc.concept_id = c.id
      LEFT JOIN users u on vs.author = u.id::text
      ORDER BY name ASC;
    `;

      const result = await dbService.query(selectAllVSQuery);

      const itemsWithAuthor = result.rows.map((item) => {
        if (item.userCreated == true) {
          item.author =
            item.firstName && item.lastName
              ? `${item.firstName} ${item.lastName}`
              : item.username;
          return item;
        }
        return item;
      });

      return {
        totalItems: result.rowCount,
        items: itemsWithAuthor,
      } as QCResponse<DibbsValueSet>;
    } catch (error) {
      console.error("Error retrieving user groups:", error);
      throw error;
    }
  }

  /**
   * Retrieves a paginated, filtered list of value sets without loading concepts.
   * @param params - Pagination and filter parameters.
   * @returns A paged response of value sets with empty concepts arrays.
   */
  @adminRequired
  static async getValueSetsPaginated(
    params: ValueSetFilterParams,
  ): Promise<QCPagedResponse<DibbsValueSet>> {
    try {
      const conditions: string[] = [];
      const values: (string | number)[] = [];
      let paramIndex = 1;

      if (params.textSearch) {
        conditions.push(
          `(vs.name ILIKE $${paramIndex} OR vs.dibbs_concept_type ILIKE $${paramIndex} OR cond.name ILIKE $${paramIndex})`,
        );
        values.push(`%${params.textSearch}%`);
        paramIndex++;
      }

      if (params.category) {
        conditions.push(`vs.dibbs_concept_type = $${paramIndex}`);
        values.push(params.category);
        paramIndex++;
      }

      if (params.codeSystem) {
        conditions.push(
          `EXISTS (SELECT 1 FROM valueset_to_concept vstc2 JOIN concepts c2 ON vstc2.concept_id = c2.id WHERE vstc2.valueset_id = vs.id AND c2.code_system = $${paramIndex})`,
        );
        values.push(params.codeSystem);
        paramIndex++;
      }

      if (params.creatorNames && params.creatorNames.length > 0) {
        const creatorPlaceholders = params.creatorNames.map(
          (_, i) => `$${paramIndex + i}`,
        );
        conditions.push(
          `(CASE WHEN vs.user_created = true AND u.first_name IS NOT NULL AND u.last_name IS NOT NULL THEN u.first_name || ' ' || u.last_name WHEN vs.user_created = true THEN u.username ELSE vs.author END) IN (${creatorPlaceholders.join(", ")})`,
        );
        values.push(...params.creatorNames);
        paramIndex += params.creatorNames.length;
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const offset = params.pageIndex * params.pageSize;

      const countSql = `
        SELECT COUNT(*) as total FROM (
          SELECT DISTINCT vs.id
          FROM valuesets vs
          LEFT JOIN condition_to_valueset ctvs ON vs.id = ctvs.valueset_id
          LEFT JOIN users u ON vs.author = u.id::text
          LEFT JOIN conditions cond ON ctvs.condition_id = cond.id
          ${whereClause}
        ) sub
      `;

      const countResult = await dbService.query(countSql, values);
      const totalItems = parseInt(countResult.rows[0].total, 10);

      const dataSql = `
        SELECT DISTINCT ON (vs.id)
          vs.id as valueset_id, vs.name as valueset_name, vs.oid as valueset_external_id,
          vs.version, vs.author, vs.type, vs.dibbs_concept_type,
          vs.user_created, ctvs.condition_id,
          u.first_name, u.last_name, u.username,
          (SELECT c.code_system FROM valueset_to_concept vstc
           JOIN concepts c ON vstc.concept_id = c.id
           WHERE vstc.valueset_id = vs.id LIMIT 1) as code_system
        FROM valuesets vs
        LEFT JOIN condition_to_valueset ctvs ON vs.id = ctvs.valueset_id
        LEFT JOIN users u ON vs.author = u.id::text
        LEFT JOIN conditions cond ON ctvs.condition_id = cond.id
        ${whereClause}
        ORDER BY vs.id
      `;

      const wrappedSql = `
        SELECT * FROM (${dataSql}) sorted
        ORDER BY valueset_name ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const dataResult = await dbService.query(wrappedSql, [
        ...values,
        params.pageSize,
        offset,
      ]);

      const items: DibbsValueSet[] = dataResult.rows.map((row) => {
        let author = row.author;
        if (row.user_created === true) {
          author =
            row.first_name && row.last_name
              ? `${row.first_name} ${row.last_name}`
              : row.username || row.author;
        }

        return {
          valueSetId: row.valueset_id,
          valueSetName: row.valueset_name,
          valueSetExternalId: row.valueset_external_id,
          valueSetVersion: row.version || "",
          author,
          system: row.code_system || "",
          ersdConceptType: row.type || undefined,
          dibbsConceptType: row.dibbs_concept_type,
          includeValueSet: true,
          concepts: [],
          conditionId: row.condition_id,
          userCreated: row.user_created ?? false,
        };
      });

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
      console.error("Error retrieving paginated value sets:", error);
      throw error;
    }
  }

  /**
   * Retrieves concepts belonging to a single value set.
   * @param valueSetId - The ID of the value set.
   * @returns A list of concepts for the given value set.
   */
  @adminRequired
  static async getConceptsByValueSetId(valueSetId: string): Promise<Concept[]> {
    try {
      const sql = `
        SELECT c.code, c.display, c.code_system, c.id as internal_id
        FROM valueset_to_concept vstc
        JOIN concepts c ON vstc.concept_id = c.id
        WHERE vstc.valueset_id = $1
        ORDER BY c.code ASC
      `;

      const result = await dbService.query(sql, [valueSetId]);

      return result.rows.map((row) => ({
        code: row.code,
        display: row.display,
        include: true,
        internalId: row.internal_id,
      }));
    } catch (error) {
      console.error("Error retrieving concepts for value set:", error);
      throw error;
    }
  }

  /**
   * Retrieves distinct author names across all value sets.
   * @returns A list of unique creator names.
   */
  @adminRequired
  static async getValueSetCreators(): Promise<string[]> {
    try {
      const sql = `
        SELECT DISTINCT
          CASE WHEN vs.user_created = true AND u.first_name IS NOT NULL AND u.last_name IS NOT NULL
               THEN u.first_name || ' ' || u.last_name
               WHEN vs.user_created = true THEN u.username
               ELSE vs.author END as author_name
        FROM valuesets vs
        LEFT JOIN users u ON vs.author = u.id::text
        WHERE vs.author IS NOT NULL
        ORDER BY author_name ASC
      `;

      const result = await dbService.query(sql);
      return result.rows
        .map((row) => row.author_name)
        .filter((name): name is string => !!name);
    } catch (error) {
      console.error("Error retrieving value set creators:", error);
      throw error;
    }
  }
}

export const getCustomCodeCondition = CustomCodeService.addCustomCodeCondition;
export const insertCustomValueSet = CustomCodeService.insertCustomValueSet;
export const deleteCustomValueSet = CustomCodeService.deleteCustomValueSet;
export const insertCustomValuesetsIntoQuery =
  CustomCodeService.insertCustomValuesetsIntoQuery;
export const deleteCustomConcept = CustomCodeService.deleteCustomConcept;
export const getCustomValueSetById = CustomCodeService.getCustomValueSetById;
export const getAllValueSets = CustomCodeService.getAllValueSets;
export const getValueSetsPaginated = CustomCodeService.getValueSetsPaginated;
export const getConceptsByValueSetId =
  CustomCodeService.getConceptsByValueSetId;
export const getValueSetCreators = CustomCodeService.getValueSetCreators;
