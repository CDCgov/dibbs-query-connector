"use server";

import { transaction } from "@/app/backend/db/decorators";
import { auditable } from "@/app/backend/audit-logs/decorator";
import { internal_getDbClient } from "../backend/db/config";
import {
  insertValueSetSql,
  insertConceptSql,
  insertValuesetToConceptSql,
  insertConditionSql,
  insertConditionToValuesetSql,
} from "./seedSqlStructs";
import {
  INTENTIONAL_EMPTY_STRING_FOR_CONCEPT_VERSION,
  INTENTIONAL_EMPTY_STRING_FOR_GEM_CODE,
} from "./constants";
import type { DibbsValueSet } from "../models/entities/valuesets";
import type { Concept } from "../models/entities/concepts";
import { QCResponse } from "../models/responses/collections";
import type { QueryDataColumn } from "@/app/(pages)/queryBuilding/utils";
import crypto from "crypto";

import { formatCodeSystemPrefix } from "./format-service";

import {
  CUSTOM_CONDITION_ID,
  CUSTOM_VALUESET_ARRAY_ID,
} from "@/app/shared/constants";
import dbService from "../backend/db/service";

class UserCreatedValuesetService {
  private static get dbClient() {
    return internal_getDbClient();
  }

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

      const result = await UserCreatedValuesetService.dbClient.query(
        selectValueSetQuery,
        [id],
      );

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
    const CUSTOM_CONDITION_ID =
      await UserCreatedValuesetService.addCustomCodeCondition(vs.system || "");

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
          INTENTIONAL_EMPTY_STRING_FOR_GEM_CODE,
          INTENTIONAL_EMPTY_STRING_FOR_CONCEPT_VERSION,
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
          ? UserCreatedValuesetService.getSystemPrefix(vs.system)
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
        const newId = crypto.randomUUID();
        const name = `Custom Query ${newId}`;
        const queryData: QueryDataColumn = {
          [CUSTOM_VALUESET_ARRAY_ID]: {},
        };

        for (const vs of customValuesets) {
          queryData[CUSTOM_VALUESET_ARRAY_ID][vs.valueSetId] = vs;
        }

        const insertSql = `
      INSERT INTO query (
        id, query_name, query_data, conditions_list, author,
        date_created, date_last_modified, time_window_number, time_window_unit
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, $7)
    `;
        await dbService.query(insertSql, [
          newId,
          name,
          queryData,
          [],
          userId,
          0,
          "",
        ]);
        return { success: true, queryId: newId };
      }
    } catch (e) {
      console.error(
        "Failed to insert or update query_data with custom valuesets:",
        e,
      );
      return { success: false, error: String(e) };
    }
  }
}

export const getCustomCodeCondition =
  UserCreatedValuesetService.addCustomCodeCondition;
export const insertCustomValueSet =
  UserCreatedValuesetService.insertCustomValueSet;
export const deleteCustomValueSet =
  UserCreatedValuesetService.deleteCustomValueSet;
export const insertCustomValuesetsIntoQuery =
  UserCreatedValuesetService.insertCustomValuesetsIntoQuery;
export const deleteCustomConcept =
  UserCreatedValuesetService.deleteCustomConcept;
export const getCustomValueSetById =
  UserCreatedValuesetService.getCustomValueSetById;
