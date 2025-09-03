"use server";

import {
  ersdToDibbsConceptMap,
  ErsdConceptType,
  MISSING_API_KEY_LITERAL,
} from "@/app/constants";
import { Bundle, Parameters, ValueSet } from "fhir/r4";
import {
  checkDBForData,
  checkValueSetInsertion,
  getERSD,
  getVSACValueSet,
  insertValueSet,
  insertDBStructArray,
  executeCategoryUpdates,
} from "@/app/backend/seeding/service";
import * as fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  ConditionStruct,
  ConditionToValueSetStruct,
  dbInsertStruct,
} from "../seeding/seedSqlStructs";
import { indexErsdByOid, translateVSACToInternalValueSet } from "./lib";
import { DibbsValueSet } from "@/app/models/entities/valuesets";

type ersdCondition = {
  code: string;
  system: string;
  text: string;
  valueset_id: string;
};

export type OidData = {
  oids: Array<string>;
  oidToErsdType: Map<string, string>;
  conditions: Array<ersdCondition>;
};

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
 * Performs eRSD querying and parsing to generate OIDs and extract clinical
 * concepts from the eRSD. First, a call is made to the eRSD, which is filtered
 * for valuesets. These valusets are used to create a mapping between OID and
 * clinical service code, as well as to actually compile the list of OIDs of all
 * valuesets in the pull-down. Then, these two entities are bundled together
 * as a data structure for future scripting.
 * @returns An OidData object containing the OIDs extracted as well as the
 * clinical service type associated with each.
 */
export async function getOidsFromErsd() {
  console.log("Fetching and parsing eRSD.");
  const ersd = await getERSD();
  const valuesets = (ersd as unknown as Bundle)["entry"]?.filter(
    (e) => e.resource?.resourceType === "ValueSet",
  );

  const { nonUmbrellaValueSets, oidToErsdType } = indexErsdByOid(valuesets);
  // Build up a mapping of OIDs to eRSD clinical types

  let conditionExtractor: Array<ersdCondition> = [];
  nonUmbrellaValueSets.reduce((acc: Array<ersdCondition>, vs: ValueSet) => {
    const conditionSchemes = vs.useContext?.filter(
      (context) =>
        !(context.valueCodeableConcept?.coding || [])[0].system?.includes(
          "us-ph-usage-context",
        ),
    );
    (conditionSchemes || []).forEach((usc) => {
      const ersdCond: ersdCondition = {
        code: (usc.valueCodeableConcept?.coding || [])[0].code || "",
        system: (usc.valueCodeableConcept?.coding || [])[0].system || "",
        text: usc.valueCodeableConcept?.text || "",
        valueset_id: vs.id || "",
      };
      conditionExtractor.push(ersdCond);
    });
    return conditionExtractor;
  }, conditionExtractor);

  // Make sure to take out the umbrella value sets from the ones we try to insert
  let oids = valuesets?.map((vs) => vs.resource?.id);
  oids = oids?.filter(
    (oid) => !Object.keys(ersdToDibbsConceptMap).includes(oid || ""),
  );
  return {
    oids: oids,
    oidToErsdType: oidToErsdType,
    conditions: conditionExtractor,
  } as OidData;
}

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
 */
export async function seedBatchValueSetsFromVsac(
  oidData: OidData,
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

    let valueSetsToInsert = (await generateBatchVsacPromises(oidsToFetch)).map(
      (r) => {
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
      },
    );

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
          await insertValueSet(vs);
        }
      }),
    );

    // Finally, we verify that the insert was performed correctly
    valueSetsToInsert.map(async (vs) => {
      if (vs) {
        let missingData = await checkValueSetInsertion(vs);
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
          await insertValueSet(vs);
          missingData = await checkValueSetInsertion(vs);
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
  await insertDBStructArray(
    conditionPromises as ConditionStruct[],
    "conditions",
  );

  // Finally, take care of mapping inserted value sets to inserted conditions
  // For this part, we do want the full list of conditions we obtained
  // from the value sets
  console.log("Inserting condition-to-valueset mappings");
  let ctvStructs = oidData.conditions.map((c) => {
    const ctvID = retiredOids.has(c.valueset_id) ? "NONE" : randomUUID();

    const dbCTV: ConditionToValueSetStruct = {
      id: ctvID,
      condition_id: c.code,
      valueset_id: c.valueset_id + "_" + oidsToVersion.get(c.valueset_id),
      source: c.system,
    };
    return dbCTV;
  });
  ctvStructs = ctvStructs.filter((ctvs) => ctvs.id !== "NONE");
  await insertDBStructArray(ctvStructs, "condition_to_valueset");
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

/**
 * Generalized function for reading JSON data out of a file, parsing it
 * into an array of database compatibile structures, and using the Connection
 * Pool to insert them. Files must be located in the mounted /assets
 * directory.
 * @param structType The type of structure to be inserted (e.g. valueset,
 * concept, etc.).
 */
async function insertSeedDbStructs(structType: string) {
  const data: string | undefined = readJsonFromRelativePath(
    "dibbs_db_seed_" + structType + ".json",
  );
  if (data) {
    const parsed: {
      [key: string]: Array<dbInsertStruct>;
    } = JSON.parse(data);
    await insertDBStructArray(parsed[structType], structType);
  } else {
    console.error("Could not load JSON data for", structType);
  }
}

/**
 * Overall orchestration function that performs the scripted process of querying
 * the eRSD, extracting OIDs, then inserting valuesets into the DB.
 * @returns a { success: true/false reload: true/false } status dictionary for
 * whether the creation failed / needs a reload on the frontend for display
 */
export async function createDibbsDB() {
  // Check if the DB already contains valuesets
  const dbHasData = await checkDBForData();

  if (!dbHasData) {
    try {
      const ersdOidData = await getOidsFromErsd();
      if (ersdOidData) {
        await seedBatchValueSetsFromVsac(ersdOidData);
      } else {
        console.error("Could not load eRSD, aborting DIBBs DB creation");
      }

      // Only run default and custom insertions if we're making the dump
      // file for dev
      // if (process.env.NODE_ENV !== "production") {
      await insertSeedDbStructs("valuesets");
      await insertSeedDbStructs("concepts");
      await insertSeedDbStructs("valueset_to_concept");
      await insertSeedDbStructs("conditions");
      await insertSeedDbStructs("condition_to_valueset");
      await insertSeedDbStructs("query");
      await insertSeedDbStructs("category");
      await executeCategoryUpdates();
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

/**
 * helper function to generate VSAC promises
 *
 * @param oidsToFetch - OIDs from the eRSD to query from VSAC
 * @returns Promises to resolve that will give you the requested VSAC valuesets
 */
export async function generateBatchVsacPromises(oidsToFetch: string[]) {
  const valueSetPromises = Promise.allSettled(
    oidsToFetch.map(async (oid) => {
      try {
        // First, we'll pull the value set from VSAC and map it to our representation
        const vs = await getVSACValueSet(oid);
        return { vs: vs, oid: oid };
      } catch (e) {
        let message = `Fetch for VSAC value set with oid ${oid} failed`;
        if (e instanceof Error) {
          message = message + ` with error message: ${e.message}`;
        }
        return Promise.reject(new Error(message));
      }
    }),
  );

  return valueSetPromises;
}
