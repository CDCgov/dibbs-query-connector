"use server";

import { ErsdConceptType, MISSING_API_KEY_LITERAL } from "@/app/constants";
import { Parameters, ValueSet } from "fhir/r4";
import { getVSACValueSet, OidData } from "@/app/backend/code-systems/service";
import { randomUUID } from "crypto";
import {
  ConditionStruct,
  ConditionToValueSetStruct,
  updatedCancerCategorySql,
  updateErsdCategorySql,
  updateNewbornScreeningCategorySql,
} from "./seedSqlStructs";
import {
  checkDBForData,
  checkValueSetInsertion,
  generateBatchVsacPromises,
  indexErsdResponseByOid,
  insertDBStructArray,
  insertSeedDbStructs,
  insertValueSet,
} from "./lib";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { DbClient } from "../db/service";
import { auditable } from "../audit-logs/decorator";
import { translateVSACToInternalValueSet } from "./utils";
import path from "path";
import { readFileSync } from "fs";

/**
 * Helper utility to resolve the relative path of a file in the docker filesystem.
 * @param filename The file to read from. Must be located in the assets folder.
 * @returns Either the stringified data, or null.
 */
export async function readJsonFromRelativePath(filename: string) {
  // Re-scope file system reads to make sure we use the relative
  // path via node directory resolution
  const runtimeServerPath = path.join(__dirname, "../../assets/", filename);
  const data = readFileSync(runtimeServerPath, "utf-8");
  return data;
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
    dbClient: DbClient,
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
      oidData.oids?.length,
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

      for (const vs of valueSetsToInsert) {
        if (vs) {
          await insertValueSet(vs, dbClient);
          let missingData = await checkValueSetInsertion(vs, dbClient);
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
            await insertValueSet(vs, dbClient);
            missingData = await checkValueSetInsertion(vs, dbClient);
          }
        }
      }
      // Finally, we verify that the insert was performed correctly

      startIdx += batchSize;
      lastIdx += batchSize;

      if (startIdx > 200) {
        throw Error("should fail without inserts");
      }
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
      }),
    );

    // Now insert them
    await insertDBStructArray(
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
        valueSetId: c.valueset_id + "_" + oidsToVersion.get(c.valueset_id),
        source: c.system,
      };
      return dbCTV;
    });
    ctvStructs = ctvStructs.filter((ctvs) => ctvs.id !== "NONE");
    await insertDBStructArray(ctvStructs, "condition_to_valueset", dbClient);
  }

  /**
   * Helper function that execute the category data updates for inserted conditions.
   * @param dbClient - The client to be used to allow seeding to be transactional. We
   * neeed to manually manage the client connection rather than delegating it to the
   * pool because of the cross-relationships in the seeding data.
   * @returns A promise that resolves to an object indicating success or failure.
   */
  static async executeCategoryUpdates(
    dbClient: DbClient,
  ): Promise<{ success: boolean }> {
    console.log("Executing category data updates on inserted conditions");
    await dbClient.query(updateErsdCategorySql);
    await dbClient.query(updateNewbornScreeningCategorySql);
    await dbClient.query(updatedCancerCategorySql);
    await dbClient.query(`DROP TABLE category_data`);
    console.log("All inserted queries cross-referenced with category data");
    return { success: true };
  }

  @auditable
  static async createDibbsDB() {
    // Check if the DB already contains valuesets
    const dbHasData = await checkDBForData();

    if (!dbHasData) {
      const dbClient = new DbClient();
      await dbClient.connect();
      await dbClient.query("BEGIN");
      try {
        const ersdOidData = await indexErsdResponseByOid();

        if (ersdOidData) {
          console.log("Seeding valuesets and relationships from VSAC");
          await SeedingService.seedBatchValueSetsFromVsac(
            ersdOidData,
            dbClient,
          );
        } else {
          console.error("Could not load eRSD, aborting DIBBs DB creation");
        }
        console.log(
          "Valuesets and relationships seeded successfully. Proceeding to seed static custom data.",
        );

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
          console.log(`Seeding ${type}`);
          await insertSeedDbStructs(type, dbClient);
        }
        console.log("Seeding static files completed successfully.");
        await SeedingService.executeCategoryUpdates(dbClient);

        await dbClient.query("COMMIT");

        console.log("DB successfully seeded");
        return { success: true };
      } catch (e) {
        console.log("Rolling back DB creation insert");

        await dbClient.query("ROLLBACK");
        if (e instanceof Error) {
          console.error("DB reload failed", e.message);
          return {
            success: false,
            message: e.message,
            cause: e.cause,
          };
        }

        return {
          success: false,
          message:
            "DB creation failed with an unknown error. Please contact us for help",
        };
      } finally {
        dbClient.disconnect();
      }
    } else {
      console.log("Database already has data; skipping DIBBs DB creation.");
      return { success: true };
    }
  }
}

export const createDibbsDB = SeedingService.createDibbsDB;
