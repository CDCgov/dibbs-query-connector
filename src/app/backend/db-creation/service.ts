"use server";

import { randomUUID } from "crypto";
import {
  ConditionToValueSetStruct,
  updatedCancerCategorySql,
  updateErsdCategorySql,
  updateNewbornScreeningCategorySql,
} from "./seedSqlStructs";
import {
  checkDBForDataInternal,
  checkValueSetInsertion,
  insertDBStructArray,
  insertSeedDbStructs,
  insertValueSet,
} from "./lib";
import { DbClient } from "../db/service";
import { fetchConditionsFromVsac } from "@/seed/service";
import { ErsdPayload, VSAC_MAX_FETCH_RETRIES } from "@/seed/utils";
import { auditable } from "../audit-logs/decorator";
import { adminRequired } from "../db/decorators/auth";
import {
  readErsdFromArtifact,
  readVsacFromArtifact,
} from "./read-db-artifacts";
import { ErsdConceptType } from "@/constants";
import {
  createErsdPayload,
  translateVSACToInternalValueSet,
} from "@/seed/process-data";
import { ValueSet } from "fhir/r4";

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
   * @param ersdPayload A data structure of IDs to lookup and clinical service mappings for
   * each such ID.
   * @param batchSize The number of asynchronous calls to fire at once. Default is 100.
   * @param dbClient - The client to be used to allow seeding to be transactional. We
   * neeed to manually manage the client connection rather than delegating it to the
   * pool because of the cross-relationships in the seeding data.
   */
  static async seedBatchValueSetsFromVsac(
    ersdPayload: ErsdPayload,
    dbClient: DbClient,
  ) {
    const { valuesets, oidsToVersion, retiredOids } =
      await composeDibbsValueSets(ersdPayload);

    for (const vs of valuesets) {
      // Retired value sets can come back without concepts. They're tracked in
      // retiredOids for the condition mappings below, so skip the insert.
      if (vs?.concepts !== undefined) {
        await insertValueSet(vs, dbClient);

        let missingData = await checkValueSetInsertion(vs, dbClient);
        // Note: We don't actually have functions for inserting concepts,
        // so if anything is missing just try re-inserting the whole VS.
        // This ensures that all reference data and FKs are also updated.
        let retries = 0;
        while (
          (missingData.missingValueSet ||
            missingData.missingConcepts.length > 0 ||
            missingData.missingMappings.length > 0) &&
          retries < VSAC_MAX_FETCH_RETRIES
        ) {
          retries++;
          console.log(
            `Resolving missing values or errors for valueset ${vs.valueSetId} (attempt ${retries}/${VSAC_MAX_FETCH_RETRIES})`,
          );
          await insertValueSet(vs, dbClient);
          missingData = await checkValueSetInsertion(vs, dbClient);
        }
        if (
          missingData.missingValueSet ||
          missingData.missingConcepts.length > 0 ||
          missingData.missingMappings.length > 0
        ) {
          throw new Error(
            `Failed to fully insert valueset ${vs.valueSetId} after ${VSAC_MAX_FETCH_RETRIES} retries`,
          );
        }
      }
    }

    // Once all the value sets are inserted, we need to do conditions
    // Step one is filtering out duplicates, since we just assembled
    // condition mappings directly from value sets
    console.log("Inserting eRSD condition data");
    const conditionSet = new Set<string>();
    ersdPayload.conditions.forEach((c) => {
      const repString = c.code + "*" + c.system + "*" + c.text;
      conditionSet.add(repString);
    });

    const conditionStructs = await fetchConditionsFromVsac(conditionSet);

    // Now insert them
    await insertDBStructArray(conditionStructs, "conditions", dbClient);

    // Finally, take care of mapping inserted value sets to inserted conditions
    // For this part, we do want the full list of conditions we obtained
    // from the value sets
    console.log("Inserting condition-to-valueset mappings");
    let ctvStructs = ersdPayload.conditions.map((c) => {
      const version = oidsToVersion.get(c.valueset_id);
      if (retiredOids.has(c.valueset_id) || !version) {
        return {
          id: "NONE",
          conditionId: c.code,
          valueSetId: "",
          source: c.system,
        } as ConditionToValueSetStruct;
      }

      const dbCTV: ConditionToValueSetStruct = {
        id: randomUUID(),
        conditionId: c.code,
        valueSetId: c.valueset_id + "_" + version,
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

  /**
   * Checks whether the database has been seeded with condition data
   * @returns true if seed data is present
   */
  @adminRequired
  static async checkDBForData() {
    return checkDBForDataInternal();
  }

  @adminRequired
  @auditable
  static async createDibbsDB() {
    // Check if the DB already contains valuesets
    const dbHasData = await checkDBForDataInternal();

    if (!dbHasData) {
      const dbClient = new DbClient();
      await dbClient.connect();
      await dbClient.query("BEGIN");
      try {
        console.log("Reading eRSD resource from disk");

        const ersdPayload = await composeErsdPayload();
        if (!ersdPayload) {
          throw new Error("Could not load eRSD, aborting DIBBs DB creation");
        }

        console.log("Seeding valuesets and relationships from VSAC");
        await SeedingService.seedBatchValueSetsFromVsac(ersdPayload, dbClient);
        console.log(
          "Valuesets and relationships seeded successfully. Proceeding to seed static custom data.",
        );

        // recreate intermediary table if needed
        await dbClient.query(`
        CREATE TABLE IF NOT EXISTS category_data (
          condition_name TEXT,
          condition_code TEXT PRIMARY KEY,
          category TEXT,
          FOREIGN KEY(condition_code) REFERENCES conditions(id)
        );
        `);

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
          // undici surfaces network failures as a generic "fetch failed" and
          // tucks the real reason (ECONNRESET, timeout, TLS, DNS) into `cause`.
          // Log it so deploy-time failures are diagnosable.
          if (e.cause) {
            console.error("Underlying cause:", e.cause);
          }
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
export const checkDBForData = SeedingService.checkDBForData;

async function composeErsdPayload() {
  const ersd = await readErsdFromArtifact();
  const ersdValuesets = ersd.filter(
    (e) =>
      (e.resource as { resourceType?: string })?.resourceType === "ValueSet",
  );

  return createErsdPayload(ersdValuesets);
}

/**
 * Function to fetch valuesets from VSAC and map them to internal valueset representation
 * @param ersdPayload - the eRSD payload to inform which valuesets needing fetching
 * @param batchSize - batch size to not overwhelm the VSAC API - 100 by default
 * @returns DibbsValueset[] - an array of DibbsValueset objects
 */
export async function composeDibbsValueSets(ersdPayload: ErsdPayload) {
  const vsacValueSets = (await readVsacFromArtifact()) as ValueSet[];

  const oidsToVersion: Map<String, String> = new Map<String, String>();
  const retiredOids: Set<String> = new Set<String>();

  const internalValueSets = vsacValueSets
    .filter((v) => v.id !== undefined)
    .map((v) => {
      const eRSDType: ErsdConceptType = ersdPayload.oidToErsdResourceMap.get(
        v.id as string,
      ) as ErsdConceptType;

      const internalValueSet = translateVSACToInternalValueSet(v, eRSDType);

      oidsToVersion.set(v.id as string, internalValueSet.valueSetVersion);

      // Found a retired OID, store it so we don't insert condition mappings on it
      if (internalValueSet.concepts === undefined) {
        retiredOids.add(internalValueSet.valueSetExternalId || "");
      }
      return internalValueSet;
    });

  return {
    valuesets: internalValueSets,
    oidsToVersion: oidsToVersion,
    retiredOids: retiredOids,
  };
}
