"use server";

import { transaction } from "@/app/backend/dbServices/decorators";
import { auditable } from "@/app/backend/auditLogs/decorator";
import { getDbClient } from "../backend/dbClient";
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
import type { QueryDataColumn } from "@/app/(pages)/queryBuilding/utils";
import crypto from "crypto";
import dbService from "@/app/backend/dbServices/db-service";

const conditionId = "custom_condition"; // This should be a unique identifier for the condition, we could just call it '0', but we will need some way to exclude it from certain screens, so that's why I lean toward it being hardcoded.

export class UserCreatedValuesetService {
  private static get dbClient() {
    return getDbClient();
  }

  // This may not be needed since these are user-created valuesets
  private static getSystemPrefix(system: string) {
    const match = system.match(/https?:\/\/([^\.]+)/);
    return match ? match[1] : system;
  }

  static async addCustomCodeCondition(system: string): Promise<string> {
    const checkSql = `SELECT id FROM conditions WHERE id = $1`;
    const result = await dbService.query(checkSql, [conditionId]);
    if (result.rows.length === 0) {
      await dbService.query(insertConditionSql, [
        conditionId,
        system,
        "Custom Code Condition",
        "20250601", // Placeholder, I don't think we really need versioning for this
        "User-Created",
      ]);
    }
    return conditionId;
  }

  @transaction
  @auditable
  static async insertCustomValueSet(
    vs: DibbsValueSet,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const errors: string[] = [];
    const uuid = crypto.randomUUID();

    const systemPrefix = UserCreatedValuesetService.getSystemPrefix(vs.system);
    const valueSetUniqueId = `${uuid}_${vs.valueSetVersion}`;
    const valueSetOid = vs.valueSetExternalId || uuid;

    // Insert Custom Code Condition if not already present
    const conditionId = await UserCreatedValuesetService.addCustomCodeCondition(
      vs.system,
    );

    // Insert ValueSet
    try {
      await dbService.query(insertValueSetSql, [
        valueSetUniqueId,
        valueSetOid, // I'm not sure if this is something we need to track
        vs.valueSetVersion, // I'm not sure if this is something we need to track, could be a timestamp or an optional user param for them to track versioning
        vs.valueSetName,
        userId, // should be a user ID of the current user
        vs.ersdConceptType ?? vs.dibbsConceptType,
        vs.dibbsConceptType,
        "true",
      ]);
    } catch (e) {
      console.error("Insert failed for valueset:", e);
      errors.push("ValueSet insert failed");
    }

    // Insert Concepts and Linkages
    for (const concept of vs.concepts) {
      // TODO: We will need to do an UPDATE display if system prefix and code already exist
      const conceptId = `${systemPrefix}_${concept.code}`;
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
    const ctvsId = `${conditionId}_${valueSetUniqueId}`;
    try {
      await dbService.query(insertConditionToValuesetSql, [
        ctvsId,
        conditionId,
        valueSetUniqueId,
        "User",
      ]);
    } catch (e) {
      console.error("Insert failed for condition_to_valueset:", e);
      errors.push(`Condition↔VS join failed: ${ctvsId}`);
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
      let queryData: QueryDataColumn = {};

      if (queryId) {
        // fetch current query_data to preserve other condition keys
        const existing = await dbService.query(
          `SELECT query_data FROM query WHERE id = $1`,
          [queryId],
        );
        if (existing.rows.length > 0 && existing.rows[0].query_data) {
          queryData = existing.rows[0].query_data as QueryDataColumn;
        }
      }

      // ensure custom condition block exists
      queryData[conditionId] = {
        ...(queryData[conditionId] ?? {}),
      };

      for (const vs of customValuesets) {
        queryData[conditionId][vs.valueSetId] = vs;
      }

      if (queryId) {
        // update existing query
        const updateSql = `UPDATE query SET query_data = $1, date_last_modified = NOW() WHERE id = $2`;
        await dbService.query(updateSql, [queryData, queryId]);
        return { success: true, queryId };
      } else {
        // create a new query with minimal data
        const newId = crypto.randomUUID();
        const insertSql = `
          INSERT INTO query (
            id, query_name, query_data, conditions_list, author,
            date_created, date_last_modified, time_window_number, time_window_unit
          )
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, $7)
        `;
        const name = `Custom Query ${newId}`;
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
export const insertCustomValuesetsIntoQuery =
  UserCreatedValuesetService.insertCustomValuesetsIntoQuery;
