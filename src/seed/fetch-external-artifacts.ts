import { Bundle, OperationOutcome, Parameters, ValueSet } from "fhir/r4";
import base64 from "base-64";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { ConditionStruct } from "@/app/backend/db-creation/seedSqlStructs";
import { ErsdConceptType, MISSING_API_KEY_LITERAL } from "@/constants";
import {
  createErsdPayload,
  translateVSACToInternalValueSet,
} from "./process-data";
import {
  VSAC_MAX_FETCH_RETRIES,
  VSAC_RETRY_BASE_DELAY_MS,
  ErsdPayload,
  VSAC_FETCH_BATCH_SIZE,
  VSAC_BATCH_DELAY_MS,
} from "./constants";

/**
 * Sleeps for the given number of milliseconds.
 * @param ms Milliseconds to wait.
 * @returns A promise that resolves once the delay elapses.
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isSuccessfulFetch(
  response: OperationOutcome | Bundle,
): response is Bundle {
  return (response as Bundle).resourceType === "Bundle";
}

/**
 * Fetches the eRSD Specification from the eRSD API. This function requires an API key
 * to access the eRSD API. The API key can be obtained at https://ersd.aimsplatform.org/#/api-keys.
 * @param eRSDVersion - The version of the eRSD specification to retrieve. Defaults to v2.
 * @returns The eRSD Specification as a FHIR Bundle or an OperationOutcome if an error occurs.
 */
export async function getERSD(
  eRSDVersion: number = 3,
): Promise<Bundle | OperationOutcome> {
  // Only allow specific, known-safe version numbers
  const allowedVersions = [1, 2, 3];
  if (!allowedVersions.includes(Number(eRSDVersion))) {
    return {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "invalid",
          diagnostics: `Invalid eRSDVersion provided: ${eRSDVersion}`,
        },
      ],
    } as OperationOutcome;
  }
  const ERSD_API_KEY = process.env.ERSD_API_KEY;
  if (!ERSD_API_KEY) {
    throw Error(
      `ERSD API Key not set. Please refer to the documentation below to get your ERSD key to continue`,
      {
        cause: MISSING_API_KEY_LITERAL,
      },
    );
  }

  const eRSDUrl = `https://ersd.aimsplatform.org/api/ersd/v${Number(eRSDVersion)}specification?format=json&api-key=${ERSD_API_KEY}`;
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
 * Wrapper function to fetch the eRSD, throwing an error if the fetch is unsuccessful.
 * @returns the eRSD bundle
 * @throws an error with the OperationOutcome diagnostics if the fetch fails
 */
export async function fetchAndProcessErsdResources() {
  console.log("📡 Fetching ERSD resources");
  const ersdResponse = await getERSD();

  if (isSuccessfulFetch(ersdResponse)) {
    return ersdResponse;
  }

  throw Error(ersdResponse.issue[0].diagnostics);
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
export async function getVSACValueset(
  oid: string,
  searchStructType: string = "valueset",
  codeSystem?: string,
): Promise<Bundle | OperationOutcome> {
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
      Authorization: "Basic " + base64.encode(username + ":" + umlsKey),
      "Content-Type": "application/fhir+json",
    }),
  });
  if (response.status === 200) {
    const data = (await response.json()) as Bundle;
    return data;
  } else {
    const diagnosticIssue = await response.json().then((r) => {
      try {
        return r?.issue[0]?.diagnostics;
      } catch {
        return r;
      }
    });
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
 * Fetches version metadata for a single eRSD condition from VSAC, retrying on
 * transient network failures. Condition lookups go out in a burst while seeding,
 * and on a constrained egress path (e.g. ECS behind a NAT gateway) the underlying
 * fetch can reject with a transport-level "fetch failed" error (connection reset,
 * timeout, TLS). We retry those with exponential backoff rather than letting a
 * single network blip abort the entire seed. A non-200 from VSAC (which
 * getVSACValueSet resolves to an OperationOutcome rather than throwing) is
 * retried the same way, falling back to the prior best-effort struct on the
 * final attempt. Non-transport failures (e.g. a missing API key) are re-thrown
 * immediately since retrying won't help.
 * @param cString The "code*system*text" representation of the condition.
 * @returns The assembled ConditionStruct ready for DB insertion.
 */
export async function fetchConditionWithRetry(
  cString: string,
): Promise<ConditionStruct> {
  const c = cString.split("*");
  let lastError: unknown;

  for (let attempt = 0; attempt <= VSAC_MAX_FETCH_RETRIES; attempt++) {
    try {
      const vsacCondition = await getVSACValueset(c[0], "condition", c[1]);

      // getVSACValueSet doesn't throw on a non-200 from VSAC; it resolves to
      // an OperationOutcome instead. A 5xx/429 is usually a transient blip on
      // the same constrained egress path, so retry it like a transport
      // failure. On the final attempt we fall through and build the struct
      // from whatever we got (an empty version), preserving the prior
      // tolerate-and-continue behavior rather than aborting the whole seed on
      // a persistently failing condition lookup.
      if (
        !isSuccessfulFetch(vsacCondition) &&
        attempt < VSAC_MAX_FETCH_RETRIES
      ) {
        const diagnostics =
          vsacCondition.issue?.[0]?.diagnostics ?? "unknown VSAC error";

        throw new Error(`VSAC returned an error response: ${diagnostics}`);
      }

      const params = vsacCondition as unknown as Parameters;
      const versionHolder = (params.parameter || []).find(
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
 * Helper function to generate batch VSAC fetches, filtering out failed promises
 * and logging appropriate warnings
 *
 * @param oidsToFetch - OIDs from the eRSD to query from VSAC
 * @returns Resolved valuesets
 */
export async function batchFetchVsacValuesets(oidsToFetch: string[]) {
  const valuesetPromises = oidsToFetch.map(async (oid) => {
    const vs = await getVSACValueset(oid);
    return { vs: vs, oid: oid };
  });

  const resolvedPromises = (await Promise.allSettled(valuesetPromises))
    .filter((v) => v.status === "fulfilled")
    .map((v) => v.value);

  const unsuccessfulFetches = resolvedPromises.filter(
    (v) => !isSuccessfulFetch(v.vs),
  );

  if (
    resolvedPromises.length !== oidsToFetch.length ||
    unsuccessfulFetches.length > 0
  ) {
    console.warn(
      "Some fetches to VSAC didn't resolve or resolved with an error",
    );

    // TODO error handle this properly

    // VSAC returns an OperationOutcome on any non-200 (auth failure,
    // not-found, etc.). Without this guard, the error response gets
    // translated into a DibbsValueSet with `concepts: undefined`, which
    // is indistinguishable from a legitimately retired valueset and gets
    // silently filtered out below. Track these so we can fail the seed
    // instead of committing an empty DB.
    // if ((vs as { resourceType?: string })?.resourceType !== "ValueSet") {
    //   const diagnostics =
    //     (vs as OperationOutcome).issue?.[0]?.diagnostics ??
    //     "unknown VSAC error";
    //   console.error(`VSAC fetch failed for OID ${oid}: ${diagnostics}`);
    //   vsacErrors.push({ oid, diagnostics });
    //   return;
    // }
    return [];
  }

  return resolvedPromises.filter((v) => isSuccessfulFetch(v.vs));
}

/**
 *
 * @param ersdPayload
 * @param batchSize
 */
export async function fetchValueSetsFromVsac(
  ersdPayload: ErsdPayload,
  batchSize = VSAC_FETCH_BATCH_SIZE,
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
    "Attempting fetches for",
    ersdPayload.oids?.length,
    "value sets.",
  );
  let vsacValuesets: Bundle[] = [];

  while (startIdx < ersdPayload.oids.length) {
    console.log("Batching IDs", startIdx, "to", lastIdx);
    const oidsToFetch = ersdPayload.oids.slice(
      startIdx,
      Math.min(lastIdx, ersdPayload.oids.length),
    );

    const vsacErrors: { oid: string; diagnostics: string }[] = [];
    let batchValuesets = await batchFetchVsacValuesets(oidsToFetch);

    const transformedValuesets = batchValuesets.map((r) => {
      const { vs, oid } = r;

      const eRSDType: ErsdConceptType = ersdPayload.oidToErsdResourceMap.get(
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

    vsacValuesets.push(batchValuesets.map((b) => b.vs));
    startIdx += batchSize;
    lastIdx += batchSize;
  }

  return vsacValuesets;
}

/**
 * Performs eRSD querying and parsing to generate OIDs and extract clinical
 * concepts from the eRSD for eventual database insertion.
 * First, a call is made to the eRSD, which is filtered
 * for valuesets. These valusets are used to create a mapping between OID and
 * clinical service code, as well as to actually compile the list of OIDs of all
 * valuesets in the pull-down. Then, these two entities are bundled together
 * as a data structure for future scripting.
 * @returns An ErsdPayload object containing extracted data for future processing
 */
export async function fetchErsdPayload() {
  const ersd = await fetchAndProcessErsdResources();

  const ersdValuesets = ersd["entry"]?.filter(
    (e) =>
      (e.resource as { resourceType?: string })?.resourceType === "ValueSet",
  );

  return createErsdPayload(ersdValuesets);
}
