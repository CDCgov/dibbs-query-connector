"use server";

import { v4 as uuidv4 } from "uuid";
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

export class UserCreatedValuesetService {
  private static get dbClient() {
    return getDbClient();
  }

  // This may not be needed since these are user-created valuesets
  private static getSystemPrefix(system: string) {
    const match = system.match(/https?:\/\/([^\.]+)/);
    return match ? match[1] : system;
  }

  private static async ensureCustomCodeCondition(
    system: string,
  ): Promise<string> {
    const conditionId = "custom_condition"; // This should be a unique identifier for the condition, we could just call it '0', but we will need some way to exclude it from certain screens, so that's why I lean toward it being hardcoded.
    const checkSql = `SELECT id FROM conditions WHERE id = $1`;
    const result = await this.dbClient.query(checkSql, [conditionId]);
    if (result.rows.length === 0) {
      await this.dbClient.query(insertConditionSql, [
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
  ): Promise<{ success: boolean; error?: string }> {
    const errors: string[] = [];

    const systemPrefix = this.getSystemPrefix(vs.system);
    const uuid = uuidv4();
    const valueSetUniqueId = `${uuid}_${vs.valueSetVersion}`;
    const valueSetOid = vs.valueSetExternalId || uuid;

    // Insert Custom Code Condition if not already present
    const conditionId = await this.ensureCustomCodeCondition(vs.system);

    // Insert ValueSet
    try {
      await this.dbClient.query(insertValueSetSql, [
        valueSetUniqueId,
        valueSetOid,
        vs.valueSetVersion,
        vs.valueSetName,
        vs.author,
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
      const conceptId = `${systemPrefix}_${concept.code}`;
      try {
        await this.dbClient.query(insertConceptSql, [
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
        await this.dbClient.query(insertValuesetToConceptSql, [
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
      await this.dbClient.query(insertConditionToValuesetSql, [
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
}
