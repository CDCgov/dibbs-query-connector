"use server";

import { randomUUID } from "crypto";
import {
  ConditionStruct,
  ConditionToValueSetStruct,
  updatedCancerCategorySql,
  updateErsdCategorySql,
  updateNewbornScreeningCategorySql,
} from "./seedSqlStructs";
import {
  checkDBForData as checkDBForDataInternal,
  checkValueSetInsertion,
  insertDBStructArray,
  insertSeedDbStructs,
  insertValueSet,
} from "./lib";
import { DbClient } from "../db/service";
import {
  fetchErsdPayload,
  fetchConditionWithRetry,
  sleep,
  fetchDibbsValueSets,
} from "@/seed/fetch-external-artifacts";
import { VSAC_BATCH_DELAY_MS, VSAC_FETCH_BATCH_SIZE } from "@/seed/constants";
import type { ErsdPayload } from "@/seed/constants";
import { auditable } from "../audit-logs/decorator";
import { adminRequired } from "../db/decorators";

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
  @adminRequired
  static async seedBatchValueSetsFromVsac(
    ersdPayload: ErsdPayload,
    dbClient: DbClient,
    batchSize = VSAC_FETCH_BATCH_SIZE,
  ) {
    const { valuesets, oidsToVersion, retiredOids } = await fetchDibbsValueSets(
      ersdPayload,
      batchSize,
    );
    const MAX_RETRIES = 3;
    for (const vs of valuesets) {
      if (vs) {
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
          retries < MAX_RETRIES
        ) {
          retries++;
          console.log(
            `Resolving missing values or errors for valueset ${vs.valueSetId} (attempt ${retries}/${MAX_RETRIES})`,
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
            `Failed to fully insert valueset ${vs.valueSetId} after ${MAX_RETRIES} retries`,
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

    // Create DB based condition structures. These VSAC lookups used to fire all
    // at once via Promise.all with no batching, throttling, or retry. On a
    // constrained egress path (e.g. ECS behind a NAT gateway) a burst of hundreds
    // of simultaneous TLS connections to VSAC regularly triggers a transient
    // "fetch failed" (connection reset / timeout), and because Promise.all rejects
    // on the first failure a single network blip aborted and rolled back the whole
    // seed. Batch the lookups (matching the value set path's concurrency) and retry
    // transient failures so the seed survives intermittent network issues.
    const conditionStrings = Array.from(conditionSet);
    const conditionStructs: ConditionStruct[] = [];

    for (
      let startIdx = 0;
      startIdx < conditionStrings.length;
      startIdx += batchSize
    ) {
      const endIdx = Math.min(startIdx + batchSize, conditionStrings.length);
      console.log("Fetching condition versions", startIdx, "to", endIdx);
      const batch = conditionStrings.slice(startIdx, endIdx);
      const batchResults = await Promise.all(
        batch.map((cString) => fetchConditionWithRetry(cString)),
      );
      conditionStructs.push(...batchResults);

      // Courtesy pause between batches so we don't overwhelm VSAC's API.
      if (endIdx < conditionStrings.length) {
        await sleep(VSAC_BATCH_DELAY_MS);
      }
    }

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
  @adminRequired
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
        const ersdPayload = await fetchErsdPayload();

        if (ersdPayload) {
          console.log("Seeding valuesets and relationships from VSAC");
          await SeedingService.seedBatchValueSetsFromVsac(
            ersdPayload,
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
