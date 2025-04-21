"use server";
import { Bundle, OperationOutcome, Parameters } from "fhir/r4";
import { getDbClient } from "../backend/dbClient";
import { transaction } from "@/app/backend/dbServices/decorators";
import { auditable } from "@/app/backend/auditLogs/decorator";
import {
  INTENTIONAL_EMPTY_STRING_FOR_CONCEPT_VERSION,
  INTENTIONAL_EMPTY_STRING_FOR_GEM_CODE,
} from "./constants";
import { encode } from "base-64";
import {
  insertValueSetSql,
  insertConceptSql,
  insertValuesetToConceptSql,
  insertConditionSql,
  insertConditionToValuesetSql,
  insertCategorySql,
  insertDemoQueryLogicSql,
  updateErsdCategorySql,
  updateNewbornScreeningCategorySql,
  updatedCancerCategorySql,
  dbInsertStruct,
  ValuesetStruct,
  ConceptStruct,
  ValuesetToConceptStruct,
  ConditionStruct,
  ConditionToValueSetStruct,
  CategoryStruct,
  QueryDataStruct,
} from "./seedSqlStructs";
import {
  CategoryToConditionArrayMap,
  ConditionsMap,
  QueryTableResult,
} from "../(pages)/queryBuilding/utils";
import type { DibbsValueSet } from "../models/entities/valuesets";
import { Concept } from "../models/entities/concepts";

const getQuerybyNameSQL = `
select q.query_name, q.id, q.query_data, q.conditions_list, q.immunization
  from query q 
  where q.query_name = $1;
`;

const getValueSetsByConditionIds = `
SELECT c.display, c.code_system, c.code, vs.name as valueset_name, vs.id as valueset_id, vs.oid as valueset_external_id, vs.version, vs.author as author, vs.type, vs.dibbs_concept_type as dibbs_concept_type, ctvs.condition_id
  FROM valuesets vs 
  LEFT JOIN condition_to_valueset ctvs on vs.id = ctvs.valueset_id 
  LEFT JOIN valueset_to_concept vstc on vs.id = vstc.valueset_id
  LEFT JOIN concepts c on vstc.concept_id = c.id
  WHERE ctvs.condition_id IN (
`;

/*
 * The expected return type from both the eRSD API and the VSAC FHIR API.
 */
type ErsdOrVsacResponse = Bundle | Parameters | OperationOutcome;

class DatabaseService {
  private static dbClient: NonNullable<ReturnType<typeof getDbClient>> =
    getDbClient();

  /**
   * Executes a search for a CustomQuery against the query-loaded Postgres
   * Database, using the saved name associated with the query as the unique
   * identifier by which to load the result.
   * @param name The name given to a stored query in the DB.
   * @returns One or more rows from the DB matching the requested saved query,
   * or an error if no results can be found.
   */
  static async getSavedQueryByName(name: string) {
    const values = [name];

    try {
      const result = await DatabaseService.dbClient.query(
        getQuerybyNameSQL,
        values,
      );
      if (result.rows.length === 0) {
        console.error("No results found for query named:", name);
        return undefined;
      }
      return result.rows[0] as unknown as QueryTableResult;
    } catch (error) {
      console.error("Error retrieving query:", error);
      throw error;
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
    const umlsKey: string = process.env.UMLS_API_KEY || "";
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
    const result = await DatabaseService.dbClient.query(query);
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
      const queryString = getValueSetsByConditionIds + escapedValues;

      const result = await DatabaseService.dbClient.query(queryString, ids);
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
  // -------------------------------- //
  //          DB Creation
  // -------------------------------- //
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
    const result = await DatabaseService.dbClient.query(query);
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
    // Begin accumulating missing data
    const missingData = {
      missingValueSet: false,
      missingConcepts: [] as Array<String>,
      missingMappings: [] as Array<String>,
    };

    // Check that the value set itself was inserted
    const vsSql = `SELECT * FROM valuesets WHERE oid = $1;`;
    try {
      const result = await DatabaseService.dbClient.query(vsSql, [
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
        const systemPrefix = DatabaseService.stripSystem(vs.system);
        const conceptId = `${systemPrefix}_${c?.code}`;
        const conceptSql = `SELECT * FROM concepts WHERE id = $1;`;

        try {
          const result = await DatabaseService.dbClient.query(conceptSql, [
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
      const result = await DatabaseService.dbClient.query(mappingSql, [
        vs.valueSetId,
      ]);
      const rows = result.rows;
      const missingConceptsFromMappings = vs.concepts.map((c) => {
        const systemPrefix = DatabaseService.stripSystem(vs.system);
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
      );
    } catch (error) {
      console.error(
        "Couldn't fetch value set to concept mappings for this valueset: ",
        error,
      );
      const systemPrefix = DatabaseService.stripSystem(vs.system);
      vs.concepts.forEach((c) => {
        const conceptUniqueId = `${systemPrefix}_${c.code}`;
        missingData.missingMappings.push(conceptUniqueId);
      });
    }

    return missingData;
  }

  // -------------------------------- //
  //          Helper Methods
  // -------------------------------- //

  static stripSystem(systemURL: string) {
    const match = systemURL.match(/https?:\/\/([^\.]+)/);
    return match ? match[1] : systemURL;
  }

  static logRejectedReasons<T>(
    resultsArray: PromiseSettledResult<T>[],
    errorMessageString: string,
  ) {
    return resultsArray
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => {
        console.error(errorMessageString);
        console.error(r.reason);
        return r.reason;
      });
  }

  /**
   * Helper function that execute the category data updates for inserted conditions.
   */
  static async executeCategoryUpdates() {
    try {
      console.log("Executing category data updates on inserted conditions");
      await DatabaseService.dbClient.query(updateErsdCategorySql);
      await DatabaseService.dbClient.query(updateNewbornScreeningCategorySql);
      await DatabaseService.dbClient.query(updatedCancerCategorySql);
      await DatabaseService.dbClient.query(`DROP TABLE category_data`);
      console.log("All inserted queries cross-referenced with category data");
    } catch (error) {
      console.error(
        "Could not update categories for inserted conditions",
        error,
      );
    }
  }

  /**
   * Helper function to generate the SQL needed for valueset insertion.
   * @param vs - The ValueSet in of the shape of our internal data model to insert
   * @returns The SQL statement for insertion
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
    ];

    return DatabaseService.dbClient.query(insertValueSetSql, valuesArray);
  }

  /**
   * Helper function to generate the SQL needed for concept insertion
   * needed during valueset creation.
   * @param vs - The ValueSet in of the shape of our internal data model to insert
   * @returns The SQL statement array for all concepts for insertion
   */
  private static generateConceptSqlPromises(vs: DibbsValueSet) {
    const insertConceptsSqlArray = vs.concepts.map((concept) => {
      const systemPrefix = DatabaseService.stripSystem(vs.system);
      const conceptUniqueId = `${systemPrefix}_${concept.code}`;

      // Duplicate value set insertion is likely to percolate to the concept level
      // Apply the same logic of overwriting if unique keys are the same
      return DatabaseService.dbClient.query(insertConceptSql, [
        conceptUniqueId,
        concept.code,
        vs.system,
        concept.display,
        INTENTIONAL_EMPTY_STRING_FOR_GEM_CODE,
        INTENTIONAL_EMPTY_STRING_FOR_CONCEPT_VERSION,
      ]);
    });

    return insertConceptsSqlArray;
  }

  /**
   * Helper function to generate the SQL needed for valueset-to-concept join insertion.
   * @param vs - The ValueSet in of the shape of our internal data model to insert
   * @returns The SQL statement array for join rows
   */
  private static generateValuesetConceptJoinSqlPromises(vs: DibbsValueSet) {
    const insertJoins = vs.concepts.map((concept) => {
      const systemPrefix = DatabaseService.stripSystem(vs.system);
      const conceptUniqueId = `${systemPrefix}_${concept.code}`;

      return DatabaseService.dbClient.query(insertValuesetToConceptSql, [
        `${vs.valueSetId}_${conceptUniqueId}`,
        vs.valueSetId,
        conceptUniqueId,
      ]);
    });

    return insertJoins;
  }

  @transaction
  @auditable
  /**
   * Function call to insert a new ValueSet into the database.
   * @param vs - a ValueSet in of the shape of our internal data model to insert
   * @returns success / failure information, as well as errors as appropriate
   */
  static async insertValueSet(vs: DibbsValueSet) {
    let errorArray: string[] = [];

    // Step 1: Insert the value set record
    try {
      await DatabaseService.generateValueSetSqlPromise(vs);
    } catch (e) {
      console.error(
        `ValueSet insertion for ${vs.valueSetId}_${vs.valueSetVersion} failed`,
      );
      console.error(e);
      errorArray.push("Error occured in valuset insertion");
    }

    // Step 2: Insert all the concepts associated with this value set
    const insertConceptsPromiseArray =
      DatabaseService.generateConceptSqlPromises(vs);
    const conceptInsertResults = await Promise.allSettled(
      insertConceptsPromiseArray,
    );

    const allConceptInsertsSucceed = conceptInsertResults.every(
      (r) => r.status === "fulfilled",
    );

    if (!allConceptInsertsSucceed) {
      DatabaseService.logRejectedReasons(
        conceptInsertResults,
        "Concept insertion failed",
      );
      errorArray.push("Error occured in concept insertion");
    }

    // Step 3: Create mappings between concepts and the value set
    const joinInsertsPromiseArray =
      DatabaseService.generateValuesetConceptJoinSqlPromises(vs);
    const joinInsertResults = await Promise.allSettled(joinInsertsPromiseArray);

    const allJoinInsertsSucceed = joinInsertResults.every(
      (r) => r.status === "fulfilled",
    );

    if (!allJoinInsertsSucceed) {
      DatabaseService.logRejectedReasons(
        joinInsertResults,
        "ValueSet <> concept join insert failed",
      );
      errorArray.push("Error occured in ValueSet <> concept join seeding");
    }

    if (errorArray.length === 0) return { success: true };
    return { success: false, error: errorArray.join(",") };
  }

  @transaction
  @auditable
  /**
   * Generic function for inserting a variety of different DB structures
   * into the databse during seeding.
   * @param structs An array of structures that's been extracted from a file.
   * @param insertType The type of structure being inserted.
   */
  static async insertDBStructArray(
    structs: dbInsertStruct[],
    insertType: string,
  ): Promise<{ success: boolean }> {
    const allStructPromises = structs.map((struct) => {
      let structInsertSql: string = "";
      let valuesToInsert: string[] = [];
      if (insertType === "valuesets") {
        structInsertSql = insertValueSetSql;
        valuesToInsert = [
          (struct as ValuesetStruct).id,
          (struct as ValuesetStruct).oid,
          (struct as ValuesetStruct).version,
          (struct as ValuesetStruct).name,
          (struct as ValuesetStruct).author,
          (struct as ValuesetStruct).type,
          (struct as ValuesetStruct).dibbs_concept_type,
        ];
      } else if (insertType === "concepts") {
        structInsertSql = insertConceptSql;
        valuesToInsert = [
          (struct as ConceptStruct).id,
          (struct as ConceptStruct).code,
          (struct as ConceptStruct).code_system,
          (struct as ConceptStruct).display,
          INTENTIONAL_EMPTY_STRING_FOR_GEM_CODE,
          (struct as ConceptStruct).version,
        ];
      } else if (insertType === "valueset_to_concept") {
        structInsertSql = insertValuesetToConceptSql;
        valuesToInsert = [
          (struct as ValuesetToConceptStruct).id,
          (struct as ValuesetToConceptStruct).valueset_id,
          (struct as ValuesetToConceptStruct).concept_id,
        ];
      } else if (insertType === "conditions") {
        structInsertSql = insertConditionSql;
        valuesToInsert = [
          (struct as ConditionStruct).id,
          (struct as ConditionStruct).system,
          (struct as ConditionStruct).name,
          (struct as ConditionStruct).version,
          (struct as ConditionStruct).category,
        ];
      } else if (insertType === "condition_to_valueset") {
        structInsertSql = insertConditionToValuesetSql;
        valuesToInsert = [
          (struct as ConditionToValueSetStruct).id,
          (struct as ConditionToValueSetStruct).condition_id,
          (struct as ConditionToValueSetStruct).valueset_id,
          (struct as ConditionToValueSetStruct).source,
        ];
      } else if (insertType === "category") {
        structInsertSql = insertCategorySql;
        valuesToInsert = [
          (struct as CategoryStruct).condition_name,
          (struct as CategoryStruct).condition_code,
          (struct as CategoryStruct).category,
        ];
      } else if (insertType === "query") {
        structInsertSql = insertDemoQueryLogicSql;
        valuesToInsert = [
          (struct as QueryDataStruct).query_name,
          (struct as QueryDataStruct).query_data,
          (struct as QueryDataStruct).conditions_list,
          (struct as QueryDataStruct).author,
          (struct as QueryDataStruct).date_created,
          (struct as QueryDataStruct).date_last_modified,
          (struct as QueryDataStruct).time_window_number,
          (struct as QueryDataStruct).time_window_unit,
        ];
      }
      return DatabaseService.dbClient.query(structInsertSql, valuesToInsert);
    });

    const allStructsInserted = await Promise.allSettled(allStructPromises);
    if (allStructsInserted.every((p) => p.status === "fulfilled")) {
      console.log("All", insertType, "inserted");
    } else {
      console.error("Problem inserting ", insertType);
      return { success: false };
    }
    return { success: true };
  }
}

export const getSavedQueryByName = DatabaseService.getSavedQueryByName;
export const checkDBForData = DatabaseService.checkDBForData;
export const checkValueSetInsertion = DatabaseService.checkValueSetInsertion;
export const executeCategoryUpdates = DatabaseService.executeCategoryUpdates;
export const getERSD = DatabaseService.getERSD;
export const getVSACValueSet = DatabaseService.getVSACValueSet;
export const insertDBStructArray = DatabaseService.insertDBStructArray;
export const insertValueSet = DatabaseService.insertValueSet;
export const getConditionsData = DatabaseService.getConditionsData;
export const getValueSetsAndConceptsByConditionIDs =
  DatabaseService.getValueSetsAndConceptsByConditionIDs;
