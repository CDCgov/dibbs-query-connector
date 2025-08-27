"use server";
import { Bundle, OperationOutcome, Parameters } from "fhir/r4";
import {
  INTENTIONAL_EMPTY_STRING_FOR_CONCEPT_VERSION,
  INTENTIONAL_EMPTY_STRING_FOR_GEM_CODE,
  MISSING_API_KEY_LITERAL,
} from "../../constants";
import { encode } from "base-64";
import {
  CategoryToConditionArrayMap,
  ConditionsMap,
} from "../../(pages)/queryBuilding/utils";
import {
  CategoryStruct,
  ConceptStruct,
  ConditionStruct,
  ConditionToValueSetStruct,
  dbInsertStruct,
  insertCategorySql,
  insertConceptSql,
  insertConditionSql,
  insertConditionToValuesetSql,
  insertDemoQueryLogicSql,
  insertValueSetSql,
  insertValuesetToConceptSql,
  QueryDataStruct,
  updatedCancerCategorySql,
  updateErsdCategorySql,
  updateNewbornScreeningCategorySql,
  ValuesetStruct,
  ValuesetToConceptStruct,
} from "./seedSqlStructs";
import { internal_getDbClient } from "../db/config";
import type { DibbsValueSet } from "../../models/entities/valuesets";
import { Concept } from "../../models/entities/concepts";
import { adminRequired, transaction } from "@/app/backend/db/decorators";
import { auditable } from "@/app/backend/audit-logs/decorator";
import { QCResponse } from "../../models/responses/collections";

export type ErsdOrVsacResponse = Bundle | Parameters | OperationOutcome;

class SeedingService {
  private static get dbClient() {
    return internal_getDbClient();
  }

  private static getValueSetsByConditionIds = `
    SELECT c.display, c.code_system, c.code, vs.name as valueset_name, vs.id as valueset_id, vs.oid as valueset_external_id, vs.version, vs.author as author, vs.type, vs.dibbs_concept_type as dibbs_concept_type, vs.user_created as user_created, ctvs.condition_id
    FROM valuesets vs 
    LEFT JOIN condition_to_valueset ctvs on vs.id = ctvs.valueset_id 
    LEFT JOIN valueset_to_concept vstc on vs.id = vstc.valueset_id
    LEFT JOIN concepts c on vstc.concept_id = c.id
    WHERE ctvs.condition_id IN (
  `;

  /**
   * Checks the database to see if data has been loaded into the valuesets table by
   * estmating the number of rows in the table. If the estimated count is greater than
   * 0, the function returns true, otherwise false.
   * @returns A boolean indicating whether the valuesets table has data.
   */
  static async checkDBForData() {
    const query = `
      SELECT reltuples AS estimated_count
      FROM pg_class
      WHERE relname = 'valuesets';
    `;
    const result = await SeedingService.dbClient.query(query);

    // Return true if the estimated count > 0, otherwise false
    return (
      result.rows.length > 0 && parseFloat(result.rows[0].estimated_count) > 0
    );
  }

  /**
   * Function that verifies that a particular value set and all its affiliated
   * concepts were successfully inserted into the DB. Given a FHIR formatted
   * value set, the function checks three things:
   *   1. Whether the value set itself was inserted
   *   2. Whether each concept included in that value set bundle was inserted
   *   3. Whether these concepts are now mapped to this value set via foreign key
   * If any data is found to be missing, it is collected and logged to the user.
   * @param vs The DIBBs internal representation of the value set to check.
   * @returns A data structure reporting on missing concepts or value set links.
   */
  static async checkValueSetInsertion(vs: DibbsValueSet) {
    const missingData = {
      missingValueSet: false,
      missingConcepts: [] as Array<string>,
      missingMappings: [] as Array<string>,
    };

    // Check that the value set itself was inserted
    const vsSql = `SELECT * FROM valuesets WHERE oid = $1;`;
    try {
      const result = await SeedingService.dbClient.query(vsSql, [
        vs.valueSetExternalId,
      ]);
      const foundVS = result.rows[0];
      if (
        foundVS.version !== vs.valueSetVersion ||
        foundVS.name !== vs.valueSetName ||
        foundVS.author !== vs.author
      ) {
        console.error(
          "Retrieved value set information differs from given value set",
        );
        missingData.missingValueSet = true;
      }
    } catch (error) {
      console.error("Couldn't fetch inserted value set from DB: ", error);
      missingData.missingValueSet = true;
    }

    // Check that all concepts under the value set's umbrella were inserted
    const brokenConcepts = await Promise.all(
      vs.concepts.map(async (c) => {
        const systemPrefix = vs.system
          ? SeedingService.stripProtocolAndTLDFromSystemUrl(vs.system)
          : "";
        const conceptId = `${systemPrefix}_${c?.code}`;
        const conceptSql = `SELECT * FROM concepts WHERE id = $1;`;

        try {
          const result = await SeedingService.dbClient.query(conceptSql, [
            conceptId,
          ]);
          const foundConcept: Concept = result.rows[0];

          // We accumulate the unique DIBBs concept IDs of anything that's missing
          if (
            foundConcept?.code !== c?.code ||
            foundConcept?.display !== c?.display
          ) {
            console.error(
              "Retrieved concept " +
                conceptId +
                " has different values than given concept",
            );
            return conceptId;
          }
        } catch (error) {
          console.error(
            "Couldn't fetch concept with ID " + conceptId + ": ",
            error,
          );
          return conceptId;
        }
      }),
    );
    missingData.missingConcepts = brokenConcepts.filter(
      (bc) => bc !== undefined,
    );

    // Confirm that valueset_to_concepts contains all relevant FK mappings
    const mappingSql = `SELECT * FROM valueset_to_concept WHERE valueset_id = $1;`;
    try {
      const result = await SeedingService.dbClient.query(mappingSql, [
        vs.valueSetId,
      ]);
      const rows = result.rows;
      const missingConceptsFromMappings = vs.concepts.map((c) => {
        const systemPrefix = vs.system
          ? SeedingService.stripProtocolAndTLDFromSystemUrl(vs.system)
          : "";
        const conceptUniqueId = `${systemPrefix}_${c.code}`;

        // Accumulate unique IDs of any concept we can't find among query rows
        const fIdx = rows.findIndex((r) => r["concept_id"] === conceptUniqueId);
        if (fIdx === -1) {
          console.error(
            "Couldn't locate concept " +
              conceptUniqueId +
              " in fetched mappings",
          );
          return conceptUniqueId;
        }
      });
      missingData.missingMappings = missingConceptsFromMappings.filter(
        (item) => item !== undefined,
      ) as string[];
    } catch (error) {
      console.error(
        "Couldn't fetch value set to concept mappings for this valueset: ",
        error,
      );
      const systemPrefix = vs.system
        ? SeedingService.stripProtocolAndTLDFromSystemUrl(vs.system)
        : "";
      vs.concepts.forEach((c) => {
        const conceptUniqueId = `${systemPrefix}_${c.code}`;
        missingData.missingMappings.push(conceptUniqueId);
      });
    }

    return missingData;
  }

  /**
   * Helper function that execute the category data updates for inserted conditions.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  @transaction
  @auditable
  static async executeCategoryUpdates(): Promise<{ success: boolean }> {
    try {
      console.log("Executing category data updates on inserted conditions");
      await SeedingService.dbClient.query(updateErsdCategorySql);
      await SeedingService.dbClient.query(updateNewbornScreeningCategorySql);
      await SeedingService.dbClient.query(updatedCancerCategorySql);
      await SeedingService.dbClient.query(`DROP TABLE category_data`);
      console.log("All inserted queries cross-referenced with category data");
      return { success: true };
    } catch (error) {
      console.error(
        "Could not update categories for inserted conditions",
        error,
      );
      return { success: false };
    }
  }

  /**
   * Fetches the eRSD Specification from the eRSD API. This function requires an API key
   * to access the eRSD API. The API key can be obtained at https://ersd.aimsplatform.org/#/api-keys.
   * @param eRSDVersion - The version of the eRSD specification to retrieve. Defaults to v2.
   * @returns The eRSD Specification as a FHIR Bundle or an OperationOutcome if an error occurs.
   */
  static async getERSD(eRSDVersion: number = 3): Promise<ErsdOrVsacResponse> {
    const ERSD_API_KEY = process.env.ERSD_API_KEY;
    if (!ERSD_API_KEY) {
      throw Error(
        `ERSD API Key not set. Please refer to the documentation below to get your ERSD key to continue`,
        {
          cause: MISSING_API_KEY_LITERAL,
        },
      );
    }

    const eRSDUrl = `https://ersd.aimsplatform.org/api/ersd/v${eRSDVersion}specification?format=json&api-key=${ERSD_API_KEY}`;
    const response = await fetch(eRSDUrl);

    if (response.status === 200) {
      const data = (await response.json()) as Bundle;

      return data;
    } else {
      return {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "processing",
            diagnostics: `Failed to retrieve data from eRSD: ${response.status} ${response.statusText}`,
          },
        ],
      } as OperationOutcome;
    }
  }

  /**
   * Fetches the VSAC Value Sets and supporting code systems information for a given OID
   * as a FHIR bundle. This function requires a UMLS API Key which must be obtained as a
   * Metathesaurus License. See https://www.nlm.nih.gov/vsac/support/usingvsac/vsacfhirapi.html
   * for authentication instructions.
   * @param oid The OID whose value sets to retrieve.
   * @param searchStructType Optionally, a flag to identify what type of
   * search to perform, since VSAC can be used for value sets as well as conditions.
   * @param codeSystem Optional parameter for use with condition querying.
   * @returns The value sets as a FHIR bundle, or an Operation Outcome if there is an error.
   */
  static async getVSACValueSet(
    oid: string,
    searchStructType: string = "valueset",
    codeSystem?: string,
  ): Promise<ErsdOrVsacResponse> {
    const username: string = "apikey";
    const umlsKey = process.env.UMLS_API_KEY;

    if (!umlsKey) {
      throw Error(
        "UMLS API Key not set. Please refer to the documentation below on how to get your UMLS API key before continuing",
        {
          cause: MISSING_API_KEY_LITERAL,
        },
      );
    }

    const vsacUrl: string =
      searchStructType === "valueset"
        ? `https://cts.nlm.nih.gov/fhir/ValueSet/${oid}`
        : `https://cts.nlm.nih.gov/fhir/CodeSystem/$lookup?system=${codeSystem}&code=${oid}`;
    const response = await fetch(vsacUrl, {
      method: "get",
      headers: new Headers({
        Authorization: "Basic " + encode(username + ":" + umlsKey),
        "Content-Type": "application/fhir+json",
      }),
    });
    if (response.status === 200) {
      const data = (await response.json()) as Bundle;
      return data;
    } else {
      const diagnosticIssue = await response
        .json()
        .then((r) => r.issue[0].diagnostics);
      return {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "processing",
            diagnostics: `${response.status}: ${diagnosticIssue}`,
          },
        ],
      } as OperationOutcome;
    }
  }

  /**
   * Generic function for inserting a variety of different DB structures
   * into the databse during seeding.
   * @param structs An array of structures that's been extracted from a file.
   * @param insertType The type of structure being inserted.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  @transaction
  @auditable
  static async insertDBStructArray(
    structs: dbInsertStruct[],
    insertType: string,
  ): Promise<{ success: boolean }> {
    let insertSql = "";
    const errors: string[] = [];

    for (const struct of structs) {
      let values: string[] = [];

      switch (insertType) {
        case "valuesets":
          insertSql = insertValueSetSql;
          values = [
            (struct as ValuesetStruct).id,
            (struct as ValuesetStruct).oid,
            (struct as ValuesetStruct).version,
            (struct as ValuesetStruct).name,
            (struct as ValuesetStruct).author,
            (struct as ValuesetStruct).type,
            (struct as ValuesetStruct).dibbs_concept_type,
            (struct as ValuesetStruct).user_created,
          ];
          break;
        case "concepts":
          insertSql = insertConceptSql;
          values = [
            (struct as ConceptStruct).id,
            (struct as ConceptStruct).code,
            (struct as ConceptStruct).code_system,
            (struct as ConceptStruct).display,
            INTENTIONAL_EMPTY_STRING_FOR_GEM_CODE,
            (struct as ConceptStruct).version,
          ];
          break;
        case "valueset_to_concept":
          insertSql = insertValuesetToConceptSql;
          values = [
            (struct as ValuesetToConceptStruct).id,
            (struct as ValuesetToConceptStruct).valueset_id,
            (struct as ValuesetToConceptStruct).concept_id,
          ];
          break;
        case "conditions":
          insertSql = insertConditionSql;
          values = [
            (struct as ConditionStruct).id,
            (struct as ConditionStruct).system,
            (struct as ConditionStruct).name,
            (struct as ConditionStruct).version,
            (struct as ConditionStruct).category,
          ];
          break;
        case "condition_to_valueset":
          insertSql = insertConditionToValuesetSql;
          values = [
            (struct as ConditionToValueSetStruct).id,
            (struct as ConditionToValueSetStruct).condition_id,
            (struct as ConditionToValueSetStruct).valueset_id,
            (struct as ConditionToValueSetStruct).source,
          ];
          break;
        case "category":
          insertSql = insertCategorySql;
          values = [
            (struct as CategoryStruct).condition_name,
            (struct as CategoryStruct).condition_code,
            (struct as CategoryStruct).category,
          ];
          break;
        case "query":
          insertSql = insertDemoQueryLogicSql;
          values = [
            (struct as QueryDataStruct).query_name,
            (struct as QueryDataStruct).query_data,
            (struct as QueryDataStruct).conditions_list,
            (struct as QueryDataStruct).author,
            (struct as QueryDataStruct).date_created,
            (struct as QueryDataStruct).date_last_modified,
            (struct as QueryDataStruct).time_window_number,
            (struct as QueryDataStruct).time_window_unit,
          ];
          break;
      }

      try {
        await SeedingService.dbClient.query(insertSql, values);
      } catch (e) {
        console.error(`Insert failed for ${insertType}:`, e);
        errors.push(
          `Insert failed for ${insertType}: ${
            e instanceof Error ? e.message : String(e)
          }`,
        );
      }
    }

    return errors.length === 0 ? { success: true } : { success: false };
  }

  /**
   * Function call to insert a new ValueSet into the database.
   * @param vs - a ValueSet in of the shape of our internal data model to insert
   * @returns success / failure information, as well as errors as appropriate
   */
  @auditable
  static async insertValueSet(
    vs: DibbsValueSet,
  ): Promise<{ success: boolean; error?: string }> {
    const errorArray: string[] = [];

    // Insert the value set
    try {
      await SeedingService.generateValueSetSqlPromise(vs);
    } catch (e) {
      console.error(
        `ValueSet insertion failed for ${vs.valueSetId}_${vs.valueSetVersion}`,
        e,
      );
      errorArray.push("Error during value set insertion");
    }

    // Insert concepts (sequentially)
    const conceptInserts = SeedingService.generateConceptSqlPromises(vs);
    for (const insert of conceptInserts) {
      try {
        await insert;
      } catch (e) {
        console.error("Error inserting concept:", e);
        errorArray.push("Error during concept insertion");
      }
    }

    // Insert concept-to-valueset joins (sequentially)
    const joinInserts =
      SeedingService.generateValuesetConceptJoinSqlPromises(vs);
    for (const join of joinInserts) {
      try {
        await join;
      } catch (e) {
        console.error("Error inserting ValueSet <-> Concept mapping:", e);
        errorArray.push("Error during ValueSet-Concept join");
      }
    }

    return errorArray.length === 0
      ? { success: true }
      : { success: false, error: errorArray.join(", ") };
  }

  // -------------------------------- //
  //  Saved Queries / Query Building
  // -------------------------------- //
  /**
   * Retrieves all records from the conditions table in the database.
   * This function queries the database to fetch condition data, including
   * condition name, code, and category.
   * @returns An object containing:
   * - `conditionCatergories`: a JSON object grouped by category with id:name pairs,
   * to display on build-query page
   * - `conditionLookup`: a JSON object with id as the key and name as the value in
   * order to make a call to the DB with the necessary ID(s) to get the valuesets
   * on subsequent pages.
   */
  static async getConditionsData() {
    const query = "SELECT * FROM conditions";
    const result = await SeedingService.dbClient.query(query);
    const rows = result.rows;

    // 1. Grouped by category with id:name pairs
    const categoryToConditionNameArrayMap: CategoryToConditionArrayMap =
      rows.reduce((acc, row) => {
        const { category, id, name } = row;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push({ id: id, name: name });
        return acc;
      }, {} as CategoryToConditionArrayMap);

    // 2. ID-Name mapping
    const conditionIdToNameMap: ConditionsMap = rows.reduce((acc, row) => {
      acc[row.id] = { name: row.name, category: row.category };
      return acc;
    }, {} as ConditionsMap);

    return {
      categoryToConditionNameArrayMap,
      conditionIdToNameMap,
    } as const;
  }

  /**
   * Executes a search for a ValueSets and Concepts against the Postgres
   * Database, using the ID of the condition associated with any such data.
   * @param ids Array of ids for entries in the conditions table
   * @returns One or more rows from the DB matching the requested saved query,
   * or an error if no results can be found.
   */
  static async getValueSetsAndConceptsByConditionIDs(ids: string[]) {
    try {
      if (ids.length === 0) {
        throw Error("No condition ids passed in to query by");
      }

      const escapedValues = ids.map((_, i) => `$${i + 1}`).join() + ")";
      const queryString =
        SeedingService.getValueSetsByConditionIds + escapedValues;

      const result = await SeedingService.dbClient.query(queryString, ids);
      if (result.rows.length === 0) {
        console.error("No results found for given condition ids", ids);
        return [];
      }
      return result.rows;
    } catch (error) {
      console.error(
        "Error retrieving value sets and concepts for condition",
        error,
      );
      throw error;
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

      const result = await SeedingService.dbClient.query(selectAllVSQuery);

      const itemsWithAuthor = result.rows.map((item) => {
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
        items: itemsWithAuthor,
      } as QCResponse<DibbsValueSet>;
    } catch (error) {
      console.error("Error retrieving user groups:", error);
      throw error;
    }
  }

  // -------------------------------- //
  //          Helper Methods
  // -------------------------------- //
  private static stripProtocolAndTLDFromSystemUrl(systemURL: string) {
    const match = systemURL.match(/https?:\/\/([^\.]+)/);
    return match ? match[1] : systemURL;
  }

  /**
   * Helper function that execute the category data updates for inserted conditions.
   * @param vs - The ValueSet in of the shape of our internal data model to insert
   * @returns The SQL statement array for the value set for insertion
   */
  private static generateValueSetSqlPromise(vs: DibbsValueSet) {
    const valueSetOid = vs.valueSetExternalId;

    // TODO: based on how non-VSAC valuests are shaped in the future, we may need
    // to update the ID scheme to have something more generically defined that
    // don't rely on potentially null external ID values.
    const valueSetUniqueId = `${valueSetOid}_${vs.valueSetVersion}`;
    // In the event a duplicate value set by OID + Version is entered, simply
    // update the existing one to have the new set of information
    // ValueSets are already uniquely identified by OID + V so this just allows
    // us to proceed with DB creation in the event a duplicate VS from another
    // group is pulled and loaded
    const valuesArray = [
      valueSetUniqueId,
      valueSetOid,
      vs.valueSetVersion,
      vs.valueSetName,
      vs.author,
      vs.dibbsConceptType,
      vs.dibbsConceptType,
      vs.userCreated ?? false,
    ];
    return SeedingService.dbClient.query(insertValueSetSql, valuesArray);
  }

  /**
   * Helper function to generate the SQL needed for concept insertion
   * needed during valueset creation.
   * @param vs - The ValueSet in of the shape of our internal data model to insert
   * @returns The SQL statement array for all concepts for insertion
   */
  private static generateConceptSqlPromises(vs: DibbsValueSet) {
    return vs.concepts.map((concept) => {
      const systemPrefix = vs.system
        ? SeedingService.stripProtocolAndTLDFromSystemUrl(vs.system)
        : "";
      const conceptUniqueId = `${systemPrefix}_${concept.code}`;
      return SeedingService.dbClient.query(insertConceptSql, [
        conceptUniqueId,
        concept.code,
        vs.system,
        concept.display,
        INTENTIONAL_EMPTY_STRING_FOR_GEM_CODE,
        INTENTIONAL_EMPTY_STRING_FOR_CONCEPT_VERSION,
      ]);
    });
  }

  /**
   * Helper function to generate the SQL needed for valueset-to-concept join insertion.
   * @param vs - The ValueSet in of the shape of our internal data model to insert
   * @returns The SQL statement array for join rows
   */
  private static generateValuesetConceptJoinSqlPromises(vs: DibbsValueSet) {
    return vs.concepts.map((concept) => {
      const systemPrefix = vs.system
        ? SeedingService.stripProtocolAndTLDFromSystemUrl(vs.system)
        : "";
      const conceptUniqueId = `${systemPrefix}_${concept.code}`;
      return SeedingService.dbClient.query(insertValuesetToConceptSql, [
        `${vs.valueSetId}_${conceptUniqueId}`,
        vs.valueSetId,
        conceptUniqueId,
      ]);
    });
  }
}

// ----------------------------------
// FULL EXPORTS
// ----------------------------------

export const checkDBForData = SeedingService.checkDBForData;
export const checkValueSetInsertion = SeedingService.checkValueSetInsertion;
export const executeCategoryUpdates = SeedingService.executeCategoryUpdates;
export const getERSD = SeedingService.getERSD;
export const getVSACValueSet = SeedingService.getVSACValueSet;
export const insertDBStructArray = SeedingService.insertDBStructArray;
export const insertValueSet = SeedingService.insertValueSet;
export const getConditionsData = SeedingService.getConditionsData;
export const getValueSetsAndConceptsByConditionIDs =
  SeedingService.getValueSetsAndConceptsByConditionIDs;
export const getAllValueSets = SeedingService.getAllValueSets;
