"use server";

import { ErsdConceptType, MISSING_API_KEY_LITERAL } from "@/app/constants";
import { OperationOutcome, Parameters, ValueSet } from "fhir/r4";
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

// Number of retry attempts for a single VSAC condition lookup that fails with a
// transient transport error (e.g. undici "fetch failed" from a connection reset
// or timeout). Total attempts = retries + 1.
const VSAC_MAX_FETCH_RETRIES = 3;
// Base delay for exponential backoff between condition-lookup retries.
const VSAC_RETRY_BASE_DELAY_MS = 1000;
// Courtesy pause between batches of condition lookups so we don't overwhelm VSAC.
const VSAC_BATCH_DELAY_MS = 1000;

/**
 * Sleeps for the given number of milliseconds.
 * @param ms Milliseconds to wait.
 * @returns A promise that resolves once the delay elapses.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper utility to resolve the path of a JSON asset file across environments.
 * In production (standalone build), __dirname resolves relative to the bundled
 * output. In dev (Turbopack), __dirname may resolve to a virtual path, so we
 * fall back to process.cwd()-based resolution.
 * @param filename The file to read from. Must be located in the assets folder.
 * @returns The stringified file data.
 */
export async function readJsonFromRelativePath(filename: string) {
  const allowedDirs = [
    path.resolve(__dirname, "../../assets"),
    path.resolve(process.cwd(), "src/app/assets"),
    path.resolve(process.cwd(), ".next/server/app/assets"),
  ];

  for (const dir of allowedDirs) {
    const resolved = path.resolve(dir, filename);
    if (!resolved.startsWith(dir + path.sep)) {
      continue;
    }
    try {
      return readFileSync(resolved, "utf-8");
    } catch {
      // Try next candidate
    }
  }

  console.error(
    `Could not find asset file ${filename}. Tried: ${allowedDirs.map((d) => path.join(d, filename)).join(", ")}`,
  );
  throw new Error(`Could not load asset file "${filename}".`);
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

      const vsacErrors: { oid: string; diagnostics: string }[] = [];
      let valueSetsToInsert = (
        await generateBatchVsacPromises(oidsToFetch)
      ).map((r) => {
        if (r.status === "rejected") {
          console.error("Valueset fetch rejected: ", r.reason);
          return;
        }

        const { vs, oid } = r.value;

        // VSAC returns an OperationOutcome on any non-200 (auth failure,
        // not-found, etc.). Without this guard, the error response gets
        // translated into a DibbsValueSet with `concepts: undefined`, which
        // is indistinguishable from a legitimately retired valueset and gets
        // silently filtered out below. Track these so we can fail the seed
        // instead of committing an empty DB.
        if ((vs as { resourceType?: string })?.resourceType !== "ValueSet") {
          const diagnostics =
            (vs as OperationOutcome).issue?.[0]?.diagnostics ??
            "unknown VSAC error";
          console.error(`VSAC fetch failed for OID ${oid}: ${diagnostics}`);
          vsacErrors.push({ oid, diagnostics });
          return;
        }

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

      if (vsacErrors.length > 0) {
        const sample = vsacErrors
          .slice(0, 3)
          .map((e) => `${e.oid} (${e.diagnostics})`)
          .join("; ");
        throw new Error(
          `VSAC returned errors for ${vsacErrors.length}/${oidsToFetch.length} OID(s) in this batch. ` +
            `Verify UMLS_API_KEY is valid and not expired. Sample: ${sample}`,
        );
      }

      // Next, in case we hit a value set that has a `retired` status and
      // a deprecated concept listing, we'll need to filter for only those
      // with defined Concepts
      valueSetsToInsert = valueSetsToInsert.filter(
        (vsp): vsp is DibbsValueSet => {
          return vsp?.concepts !== undefined;
        },
      );

      const MAX_RETRIES = 3;
      for (const vs of valueSetsToInsert) {
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
      // Finally, we verify that the insert was performed correctly

      startIdx += batchSize;
      lastIdx += batchSize;
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

    // Create DB based condition structures. These VSAC lookups used to fire all
    // at once via Promise.all with no batching, throttling, or retry. On a
    // constrained egress path (e.g. ECS behind a NAT gateway) a burst of hundreds
    // of simultaneous TLS connections to VSAC regularly triggers a transient
    // "fetch failed" (connection reset / timeout), and because Promise.all rejects
    // on the first failure a single network blip aborted and rolled back the whole
    // seed. Batch the lookups (matching the value set path's concurrency) and retry
    // transient failures so the seed survives intermittent network issues.
    const conditionStrings = Array.from(conditionSet);
    const conditionPromises: ConditionStruct[] = [];

    for (
      let startIdx = 0;
      startIdx < conditionStrings.length;
      startIdx += batchSize
    ) {
      const endIdx = Math.min(startIdx + batchSize, conditionStrings.length);
      console.log("Fetching condition versions", startIdx, "to", endIdx);
      const batch = conditionStrings.slice(startIdx, endIdx);
      const batchResults = await Promise.all(
        batch.map((cString) => SeedingService.fetchConditionWithRetry(cString)),
      );
      conditionPromises.push(...batchResults);

      // Courtesy pause between batches so we don't overwhelm VSAC's API.
      if (endIdx < conditionStrings.length) {
        await sleep(VSAC_BATCH_DELAY_MS);
      }
    }

    // Now insert them
    await insertDBStructArray(conditionPromises, "conditions", dbClient);

    // Finally, take care of mapping inserted value sets to inserted conditions
    // For this part, we do want the full list of conditions we obtained
    // from the value sets
    console.log("Inserting condition-to-valueset mappings");
    let ctvStructs = oidData.conditions.map((c) => {
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
   * Fetches version metadata for a single eRSD condition from VSAC, retrying on
   * transient network failures. Condition lookups go out in a burst while seeding,
   * and on a constrained egress path (e.g. ECS behind a NAT gateway) the underlying
   * fetch can reject with a transport-level "fetch failed" error (connection reset,
   * timeout, TLS). We retry those with exponential backoff rather than letting a
   * single network blip abort the entire seed. Non-transport failures (e.g. a
   * missing API key) are re-thrown immediately since retrying won't help.
   * @param cString The "code*system*text" representation of the condition.
   * @returns The assembled ConditionStruct ready for DB insertion.
   */
  static async fetchConditionWithRetry(
    cString: string,
  ): Promise<ConditionStruct> {
    const c = cString.split("*");
    let lastError: unknown;

    for (let attempt = 0; attempt <= VSAC_MAX_FETCH_RETRIES; attempt++) {
      try {
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
        return {
          id: c[0],
          system: c[1],
          name: c[2],
          version: version,
          category: "",
        };
      } catch (e) {
        // A missing API key (or any non-transport failure) won't be fixed by
        // retrying, so surface it immediately.
        if (e instanceof Error && e.cause === MISSING_API_KEY_LITERAL) {
          throw e;
        }
        lastError = e;
        if (attempt < VSAC_MAX_FETCH_RETRIES) {
          const backoffMs = VSAC_RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          console.warn(
            `VSAC condition lookup for ${c[0]} failed ` +
              `(attempt ${attempt + 1}/${VSAC_MAX_FETCH_RETRIES + 1}): ` +
              `${e instanceof Error ? e.message : String(e)}. ` +
              `Retrying in ${backoffMs}ms.`,
          );
          await sleep(backoffMs);
        }
      }
    }

    throw new Error(
      `VSAC condition lookup for ${c[0]} failed after ` +
        `${VSAC_MAX_FETCH_RETRIES + 1} attempts: ` +
        `${lastError instanceof Error ? lastError.message : String(lastError)}`,
      { cause: lastError },
    );
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
