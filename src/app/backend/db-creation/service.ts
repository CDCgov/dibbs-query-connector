"use server";

import { ErsdConceptType, MISSING_API_KEY_LITERAL } from "@/app/constants";
import { Parameters, ValueSet } from "fhir/r4";
import {
  generateBatchVsacPromises,
  getOidsFromErsd,
  getVSACValueSet,
  OidData,
} from "@/app/backend/code-systems/service";
import * as fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  CategoryStruct,
  ConceptStruct,
  ConditionStruct,
  ConditionToValueSetStruct,
  dbInsertStruct,
  getValueSetsByConditionIdsSql,
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
import { translateVSACToInternalValueSet } from "./lib";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import dbService from "../db/service";
import { PoolClient } from "pg";
import { auditable } from "../audit-logs/decorator";
import { Concept } from "@/app/models/entities/concepts";

/**
 * Simple helper function to cause script-running functions to pause for a
 * specified amount of time.
 * @param ms The time in miliseconds.
 * @returns void
 */
const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Helper function to clean url-related info from system fields
 * @param systemURL - system to clean
 * @returns the slug of the URL that includes only the system information
 */
function stripProtocolAndTLDFromSystemUrl(systemURL: string) {
  const match = systemURL.match(/https?:\/\/([^\.]+)/);
  return match ? match[1] : systemURL;
}

/**
 * Helper utility to resolve the relative path of a file in the docker filesystem.
 * @param filename The file to read from. Must be located in the assets folder.
 * @returns Either the stringified data, or null.
 */
function readJsonFromRelativePath(filename: string) {
  try {
    // Re-scope file system reads to make sure we use the relative
    // path via node directory resolution
    const runtimeServerPath = path.join(__dirname, "../../assets/", filename);
    const data = fs.readFileSync(runtimeServerPath, "utf-8");
    return data;
  } catch (error) {
    console.error("Error reading JSON file:", error);
    return;
  }
}

class SeedingService {
  /**
   * Function that performs batch retrieval and insertion of a collection of value sets
   * based on queries to the VSAC API. Given a set of OidData including IDs to reference
   * and clinical service types, the function queries VSAC in asynchronous batches of
   * 100 queries for included concept information. Each of these calls then performs
   * a DB insert using our timed connection pool, as well as checks the inserted data
   * against the VSAC retrieval to make sure everything was inserted successfully.
   * As a courtesy, we sleep between batches to not overload the VSAC API and to synch
   * up with our DB Config Pool's connection thread timeout setting.
   * @param oidData A data structure of IDs to lookup and clinical service mappings for
   * each such ID.
   * @param batchSize The number of asynchronous calls to fire at once. Default is 100.
   * @param dbClient - The client to be used to allow seeding to be transactional. We
   * neeed to manually manage the client connection rather than delegating it to the
   * pool because of the cross-relationships in the seeding data.
   */
  static async seedBatchValueSetsFromVsac(
    oidData: OidData,
    dbClient: PoolClient,
    batchSize = 100,
  ) {
    const umlsKey = process.env.UMLS_API_KEY;
    if (!umlsKey) {
      throw Error(
        "UMLS API Key not set. Please refer to the documentation below on how to get your UMLS API key before continuing",
        {
          cause: MISSING_API_KEY_LITERAL,
        },
      );
    }
    let startIdx = 0;
    let lastIdx = startIdx + batchSize;

    const oidsToVersion: Map<String, String> = new Map<String, String>();
    const retiredOids: Set<String> = new Set<String>();

    console.log(
      "Attempting fetches and inserts for",
      oidData.oids.length,
      "value sets.",
    );

    while (startIdx < oidData.oids.length) {
      console.log("Batching IDs", startIdx, "to", lastIdx);
      const oidsToFetch = oidData.oids.slice(
        startIdx,
        Math.min(lastIdx, oidData.oids.length),
      );

      let valueSetsToInsert = (
        await generateBatchVsacPromises(oidsToFetch)
      ).map((r) => {
        if (r.status === "rejected") {
          console.error("Valueset fetch rejected: ", r.reason);
          return;
        }

        const { vs, oid } = r.value;
        const eRSDType: ErsdConceptType = oidData.oidToErsdType.get(
          oid,
        ) as ErsdConceptType;
        const internalValueSet = translateVSACToInternalValueSet(
          vs as unknown as ValueSet,
          eRSDType,
        );

        oidsToVersion.set(oid, internalValueSet.valueSetVersion);

        // Found a retired OID, store it so we don't insert condition mappings on it
        if (internalValueSet.concepts === undefined) {
          retiredOids.add(internalValueSet.valueSetExternalId || "");
        }
        return internalValueSet;
      });

      // Next, in case we hit a value set that has a `retired` status and
      // a deprecated concept listing, we'll need to filter for only those
      // with defined Concepts
      valueSetsToInsert = valueSetsToInsert.filter(
        (vsp): vsp is DibbsValueSet => {
          return vsp?.concepts !== undefined;
        },
      );

      // Then, we'll insert it into our database instance
      await Promise.all(
        valueSetsToInsert.map(async (vs) => {
          if (vs) {
            await SeedingService.insertValueSet(vs, dbClient);
          }
        }),
      );

      // Finally, we verify that the insert was performed correctly
      valueSetsToInsert.map(async (vs) => {
        if (vs) {
          let missingData = await SeedingService.checkValueSetInsertion(vs);
          // Note: We don't actually have functions for inserting concepts,
          // so if anything is missing just try re-inserting the whole VS.
          // This ensures that all reference data and FKs are also updated.
          while (
            missingData.missingValueSet ||
            missingData.missingConcepts.length > 0 ||
            missingData.missingMappings.length > 0
          ) {
            console.log(
              "Resolving missing values or errors for valueset",
              vs.valueSetId,
            );
            await SeedingService.insertValueSet(vs, dbClient);
            missingData = await SeedingService.checkValueSetInsertion(vs);
          }
        }
      });

      startIdx += batchSize;
      lastIdx += batchSize;

      // Note: leave this time at 2000ms; our DB new connection timeout
      // is also configured to 2s, so this allows all the async requests
      // to successfully fire off and grab pooled connections as they're
      // free to ensure the pool itself doesn't time out
      await sleep(2000);
    }

    // Once all the value sets are inserted, we need to do conditions
    // Step one is filtering out duplicates, since we just assembled
    // condition mappings directly from value sets
    console.log("Inserting eRSD condition data");
    const conditionSet = new Set<string>();
    oidData.conditions.forEach((c) => {
      const repString = c.code + "*" + c.system + "*" + c.text;
      conditionSet.add(repString);
    });

    // Create DB based condition structures
    let conditionPromises = await Promise.all(
      Array.from(conditionSet).map(async (cString) => {
        try {
          const c = cString.split("*");
          const vsacCondition: Parameters = (await getVSACValueSet(
            c[0],
            "condition",
            c[1],
          )) as Parameters;
          const versionHolder = (vsacCondition.parameter || []).find(
            (p) => p.name === "version",
          );
          const versionArray = (versionHolder?.valueString || "").split("/");
          const version = versionArray[versionArray.length - 1];
          const finalCondition: ConditionStruct = {
            id: c[0],
            system: c[1],
            name: c[2],
            version: version,
            category: "",
          };
          return finalCondition;
        } catch (error) {
          console.error(error);
        }
      }),
    );

    // Now insert them
    await SeedingService.insertDBStructArray(
      conditionPromises as ConditionStruct[],
      "conditions",
      dbClient,
    );

    // Finally, take care of mapping inserted value sets to inserted conditions
    // For this part, we do want the full list of conditions we obtained
    // from the value sets
    console.log("Inserting condition-to-valueset mappings");
    let ctvStructs = oidData.conditions.map((c) => {
      const ctvID = retiredOids.has(c.valueset_id) ? "NONE" : randomUUID();

      const dbCTV: ConditionToValueSetStruct = {
        id: ctvID,
        conditionId: c.code,
        valuesetId: c.valueset_id + "_" + oidsToVersion.get(c.valueset_id),
        source: c.system,
      };
      return dbCTV;
    });
    ctvStructs = ctvStructs.filter((ctvs) => ctvs.id !== "NONE");
    await SeedingService.insertDBStructArray(
      ctvStructs,
      "condition_to_valueset",
      dbClient,
    );
  }

  /**
   * Function call to insert a new ValueSet into the database.
   * @param vs - a ValueSet in of the shape of our internal data model to insert
   * @param dbClient - The client to be used to allow seeding to be transactional. We
   * neeed to manually manage the client connection rather than delegating it to the
   * pool because of the cross-relationships in the seeding data.
   * @returns success / failure information, as well as errors as appropriate
   */
  static async insertValueSet(
    vs: DibbsValueSet,
    dbClient: PoolClient,
  ): Promise<{ success: boolean; error?: string }> {
    const errorArray: string[] = [];

    // Insert the value set
    try {
      await SeedingService.generateValueSetSqlPromise(vs, dbClient);
    } catch (e) {
      console.error(
        `ValueSet insertion failed for ${vs.valueSetId}_${vs.valueSetVersion}`,
        e,
      );
      errorArray.push("Error during value set insertion");
    }

    // Insert concepts (sequentially)
    const conceptInserts = SeedingService.generateConceptSqlPromises(
      vs,
      dbClient,
    );
    for (const insert of conceptInserts) {
      try {
        await insert;
      } catch (e) {
        console.error("Error inserting concept:", e);
        errorArray.push("Error during concept insertion");
      }
    }
    // Insert concept-to-valueset joins (sequentially)
    const joinInserts = SeedingService.generateValuesetConceptJoinSqlPromises(
      vs,
      dbClient,
    );
    for (const join of joinInserts) {
      try {
        await join;
      } catch (e) {
        console.error("Error inserting ValueSet <-> Concept mapping:", e);
        errorArray.push("Error during ValueSet-Concept join");
        throw Error("Join failed");
      }
    }

    return errorArray.length === 0
      ? { success: true }
      : { success: false, error: errorArray.join(", ") };
  }

  /**
   * Helper function that execute the category data updates for inserted conditions.
   * @param dbClient - The client to be used to allow seeding to be transactional. We
   * neeed to manually manage the client connection rather than delegating it to the
   * pool because of the cross-relationships in the seeding data.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  static async executeCategoryUpdates(
    dbClient: PoolClient,
  ): Promise<{ success: boolean }> {
    try {
      console.log("Executing category data updates on inserted conditions");
      await dbClient.query(updateErsdCategorySql);
      await dbClient.query(updateNewbornScreeningCategorySql);
      await dbClient.query(updatedCancerCategorySql);
      await dbClient.query(`DROP TABLE category_data`);
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

  @auditable
  static async createDibbsDB() {
    // Check if the DB already contains valuesets
    const dbHasData = await checkDBForData();

    if (!dbHasData) {
      try {
        const ersdOidData = await getOidsFromErsd();
        const dbClient = await dbService.connect();
        dbClient.query("BEGIN");
        if (ersdOidData) {
          await SeedingService.seedBatchValueSetsFromVsac(
            ersdOidData,
            dbClient,
          );
        } else {
          console.error("Could not load eRSD, aborting DIBBs DB creation");
        }

        // Only run default and custom insertions if we're making the dump
        // file for dev
        // if (process.env.NODE_ENV !== "production") {
        const insertionTypes = [
          "valuesets",
          "concepts",
          "valueset_to_concept",
          "conditions",
          "condition_to_valueset",
          "query",
          "category",
        ];

        for (const type of insertionTypes) {
          await SeedingService.insertSeedDbStructs(type, dbClient);
        }

        await SeedingService.executeCategoryUpdates(dbClient);
        dbClient.query("COMMIT");
        dbService.disconnect();

        return { success: true, reload: true };

        // }
      } catch (e) {
        if (e instanceof Error) {
          console.error("DB reload failed", e.message);
          return {
            success: false,
            reload: false,
            message: e.message,
            cause: e.cause,
          };
        }

        return {
          success: false,
          reload: false,
          message:
            "DB creation failed with an unknown error. Please contact us for help",
        };
      }
    } else {
      console.log("Database already has data; skipping DIBBs DB creation.");
      return { success: true, reload: false };
    }
  }

  // -------------------------------- //
  //          Helper Methods
  // -------------------------------- //
  /**
   * Function that verifies that a particular value set and all its affiliated
   * concepts were successfully inserted into the DB. Given a FHIR formatted
   * value set, the function checks three things:
   *   1. Whether the value set itself was inserted
   *   2. Whether each concept included in that value set bundle was inserted
   *   3. Whether these concepts are now mapped to this value set via foreign key
   * If any data is found to be missing, it is collected and logged to the user.
   * @param vs The DIBBs internal representation of the value set to check.
   * @param dbClient - The client to be used to allow seeding to be transactional. We
   * neeed to manually manage the client connection rather than delegating it to the
   * pool because of the cross-relationships in the seeding data.
   
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
      const result = await dbService.query(vsSql, [vs.valueSetExternalId]);
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
          ? stripProtocolAndTLDFromSystemUrl(vs.system)
          : "";
        const conceptId = `${systemPrefix}_${c?.code}`;
        const conceptSql = `SELECT * FROM concepts WHERE id = $1;`;

        try {
          const result = await dbService.query(conceptSql, [conceptId]);
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
      const result = await dbService.query(mappingSql, [vs.valueSetId]);
      const rows = result.rows;
      const missingConceptsFromMappings = vs.concepts.map((c) => {
        const systemPrefix = vs.system
          ? stripProtocolAndTLDFromSystemUrl(vs.system)
          : "";
        const conceptUniqueId = `${systemPrefix}_${c.code}`;

        // Accumulate unique IDs of any concept we can't find among query rows
        const fIdx = rows.findIndex((r) => r["conceptId"] === conceptUniqueId);
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
        ? stripProtocolAndTLDFromSystemUrl(vs.system)
        : "";
      vs.concepts.forEach((c) => {
        const conceptUniqueId = `${systemPrefix}_${c.code}`;
        missingData.missingMappings.push(conceptUniqueId);
      });
    }

    return missingData;
  }

  /**
   * Generalized function for reading JSON data out of a file, parsing it
   * into an array of database compatibile structures, and using the Connection
   * Pool to insert them. Files must be located in the mounted /assets
   * directory.
   * @param structType The type of structure to be inserted (e.g. valueset,
   * concept, etc.).
   * @param dbClient - The client to be used to allow seeding to be transactional. We
   * neeed to manually manage the client connection rather than delegating it to the
   * pool because of the cross-relationships in the seeding data.
   */
  static async insertSeedDbStructs(structType: string, dbClient: PoolClient) {
    const data: string | undefined = readJsonFromRelativePath(
      "dibbs_db_seed_" + structType + ".json",
    );
    if (data) {
      const parsed: {
        [key: string]: Array<dbInsertStruct>;
      } = JSON.parse(data);
      await SeedingService.insertDBStructArray(
        parsed[structType],
        structType,
        dbClient,
      );
    } else {
      console.error("Could not load JSON data for", structType);
    }
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
      const queryString = getValueSetsByConditionIdsSql + escapedValues;

      const result = await dbService.query(queryString, ids);
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
    const result = await dbService.query(query);

    // Return true if the estimated count > 0, otherwise false
    return (
      result.rows.length > 0 && parseFloat(result.rows[0].estimated_count) > 0
    );
  }

  /**
   * Helper function to generate the SQL needed for valueset-to-concept join insertion.
   * @param vs - The ValueSet in of the shape of our internal data model to insert
   * @param dbClient - The client to be used to allow seeding to be transactional. We
   * neeed to manually manage the client connection rather than delegating it to the
   * pool because of the cross-relationships in the seeding data.
   * @returns The SQL statement array for join rows
   */
  private static generateValuesetConceptJoinSqlPromises(
    vs: DibbsValueSet,
    dbClient: PoolClient,
  ) {
    return vs.concepts.map((concept) => {
      const systemPrefix = vs.system
        ? stripProtocolAndTLDFromSystemUrl(vs.system)
        : "";
      const conceptUniqueId = `${systemPrefix}_${concept.code}`;

      return dbClient.query(insertValuesetToConceptSql, [
        `${vs.valueSetId}_${conceptUniqueId}`,
        vs.valueSetId,
        conceptUniqueId,
      ]);
    });
  }

  /**
   * Generic function for inserting a variety of different DB structures
   * into the databse during seeding.
   * @param structs An array of structures that's been extracted from a file.
   * @param insertType The type of structure being inserted.
   * @param dbClient - The client to be used to allow seeding to be transactional. We
   * neeed to manually manage the client connection rather than delegating it to the
   * pool because of the cross-relationships in the seeding data.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  static async insertDBStructArray(
    structs: dbInsertStruct[],
    insertType: string,
    dbClient: PoolClient,
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
            (struct as ValuesetStruct).dibbsConceptType,
            (struct as ValuesetStruct).userCreated,
          ];
          break;
        case "concepts":
          insertSql = insertConceptSql;
          values = [
            (struct as ConceptStruct).id,
            (struct as ConceptStruct).code,
            (struct as ConceptStruct).codeSystem,
            (struct as ConceptStruct).display,
          ];
          break;
        case "valueset_to_concept":
          insertSql = insertValuesetToConceptSql;
          values = [
            (struct as ValuesetToConceptStruct).id,
            (struct as ValuesetToConceptStruct).valuesetId,
            (struct as ValuesetToConceptStruct).conceptId,
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
            (struct as ConditionToValueSetStruct).conditionId,
            (struct as ConditionToValueSetStruct).valuesetId,
            (struct as ConditionToValueSetStruct).source,
          ];
          break;
        case "category":
          insertSql = insertCategorySql;
          values = [
            (struct as CategoryStruct).conditionName,
            (struct as CategoryStruct).conditionCode,
            (struct as CategoryStruct).category,
          ];
          break;
        case "query":
          insertSql = insertDemoQueryLogicSql;
          values = [
            (struct as QueryDataStruct).queryName,
            (struct as QueryDataStruct).queryData,
            (struct as QueryDataStruct).conditionsList,
            (struct as QueryDataStruct).author,
            (struct as QueryDataStruct).dateCreated,
            (struct as QueryDataStruct).dateLastModified,
          ];
          break;
      }

      try {
        await dbClient.query(insertSql, values);
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
   * Helper function to generate the SQL needed for concept insertion
   * needed during valueset creation.
   * @param vs - The ValueSet in of the shape of our internal data model to insert
   * @returns The SQL statement array for all concepts for insertion
   * @param dbClient - The client to be used to allow seeding to be transactional. We
   * neeed to manually manage the client connection rather than delegating it to the
   * pool because of the cross-relationships in the seeding data.
   */
  private static generateConceptSqlPromises(
    vs: DibbsValueSet,
    dbClient: PoolClient,
  ) {
    return vs.concepts.map((concept) => {
      const systemPrefix = vs.system
        ? stripProtocolAndTLDFromSystemUrl(vs.system)
        : "";
      const conceptUniqueId = `${systemPrefix}_${concept.code}`;

      return dbClient.query(insertConceptSql, [
        conceptUniqueId,
        concept.code,
        vs.system,
        concept.display,
      ]);
    });
  }
  /**
   * Helper function that execute the category data updates for inserted conditions.
   * @param vs - The ValueSet in of the shape of our internal data model to insert
   * @param dbClient - Specific managed DbClient to prevent transaction errors
   * @returns The SQL statement array for the value set for insertion
   */
  private static generateValueSetSqlPromise(
    vs: DibbsValueSet,
    dbClient: PoolClient,
  ) {
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
    return dbClient.query(insertValueSetSql, valuesArray);
  }
}

export const createDibbsDB = SeedingService.createDibbsDB;
export const insertValueSet = SeedingService.insertValueSet;
export const checkDBForData = SeedingService.checkDBForData;
export const getValueSetsAndConceptsByConditionIDs =
  SeedingService.getValueSetsAndConceptsByConditionIDs;
