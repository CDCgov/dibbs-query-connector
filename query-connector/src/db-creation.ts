import { ersdToDibbsConceptMap, ErsdConceptType } from "@/app/constants";
import { Bundle, BundleEntry, ValueSet } from "fhir/r4";
import {
  checkValueSetInsertion,
  getERSD,
  getVSACValueSet,
  insertValueSet,
  translateVSACToInternalValueSet,
} from "@/app/database-service";

const ERSD_TYPED_RESOURCE_URL = "http://ersd.aimsplatform.org/fhir/ValueSet/";

type OidData = {
  oids: Array<string>;
  oidToErsdType: Map<string, string>;
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
async function getOidsFromErsd() {
  try {
    console.log("Fetching and parsing eRSD.");
    const ersd = await getERSD();
    const valuesets = (ersd as unknown as Bundle)["entry"]?.filter(
      (e) => e.resource?.resourceType === "ValueSet"
    );

    // Build up a mapping of OIDs to eRSD clinical types
    const oidToErsdType = new Map<string, string>();
    Object.keys(ersdToDibbsConceptMap).forEach((k) => {
      const keyedUrl = ERSD_TYPED_RESOURCE_URL + k;
      const umbrellaValueSet = valuesets?.find((vs) => vs.fullUrl === keyedUrl);

      // These "bulk" valuesets of service types compose references
      // to all value sets that fall under their purview
      const composedValueSets: Array<string> =
        (umbrellaValueSet as BundleEntry<ValueSet>)?.resource?.compose
          ?.include[0].valueSet || ([] as Array<string>);
      composedValueSets.reduce((acc: Map<string, string>, vsUrl: string) => {
        const vsArray = vsUrl.split("/");
        const oid = vsArray[vsArray.length - 1];
        acc.set(oid, k);
        return acc;
      }, oidToErsdType);
    });

    // Make sure to take out the umbrella value sets from the ones we try to insert
    let oids = valuesets?.map((vs) => vs.resource?.id);
    oids = oids?.filter(
      (oid) => !Object.keys(ersdToDibbsConceptMap).includes(oid || "")
    );
    return { oids: oids, oidToErsdType: oidToErsdType } as OidData;
  } catch (error) {
    console.error("Couldn't query eRSD: ", error);
  }
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
async function fetchBatchValueSetsFromVsac(oidData: OidData, batchSize = 100) {
  let startIdx = 0;
  let lastIdx = startIdx + batchSize;

  console.log(
    "Attempting fetches and inserts for",
    oidData.oids.length,
    "value sets."
  );

  while (startIdx < oidData.oids.length) {
    console.log("Batching IDs", startIdx, "to", lastIdx);
    const oidsToFetch = oidData.oids.slice(
      startIdx,
      Math.min(lastIdx, oidData.oids.length)
    );

    let valueSetPromises = await Promise.all(
      oidsToFetch.map(async (oid) => {
        // First, we'll pull the value set from VSAC and map it to our representation
        try {
          const vs = await getVSACValueSet(oid);
          const eRSDType: ErsdConceptType = oidData.oidToErsdType.get(
            oid
          ) as ErsdConceptType;
          const internalValueSet = await translateVSACToInternalValueSet(
            vs as unknown as ValueSet,
            eRSDType
          );
          return internalValueSet;
        } catch (error) {
          console.error(error);
        }
      })
    );

    // Next, in case we hit a value set that has a `retired` status and
    // a deprecated concept listing, we'll need to filter for only those
    // with defined Concepts
    valueSetPromises = valueSetPromises.filter(
      (vsp) => vsp?.concepts !== undefined
    );

    // Then, we'll insert it into our database instance
    await Promise.all(
      valueSetPromises.map(async (vs) => {
        if (vs) {
          await insertValueSet(vs);
        }
      })
    );

    // // Finally, we verify that the insert was performed correctly
    valueSetPromises.map(async (vs) => {
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
            vs.valueSetId
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
}

/**
 * Overall orchestration function that performs the scripted process of querying
 * the eRSD, extracting OIDs, then inserting valuesets into the DB.
 */
export async function createDibbsDB() {
  const ersdOidData = await getOidsFromErsd();
  if (ersdOidData) {
    await fetchBatchValueSetsFromVsac(ersdOidData);
  } else {
    console.error("Could not load eRSD, aborting DIBBs DB creation");
  }
}
