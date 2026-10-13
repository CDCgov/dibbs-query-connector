import { Bundle, OperationOutcome, Parameters, ValueSet } from "fhir/r4";
import base64 from "base-64";
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
} from "./constants";

/**
 * Sleeps for the given number of milliseconds.
 * @param ms Milliseconds to wait.
 * @returns A promise that resolves once the delay elapses.
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type FhirFetchResult = OperationOutcome | Bundle | ValueSet;

function isSuccessfulFetch(response: FhirFetchResult): response is Bundle {
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

export type VsacResult = {
  vs: ValueSet;
  oid: string;
};

type VsacErrorResult = {
  error: OperationOutcome | PromiseRejectedResult;
  oid: string;
};

function isFhirValueset(response: FhirFetchResult): response is ValueSet {
  return (response as ValueSet).resourceType === "ValueSet";
}
/**
 * Helper function to generate batch VSAC fetches, filtering out failed promises
 * and logging appropriate warnings
 *
 * @param oidsToFetch - OIDs from the eRSD to query from VSAC
 * @returns Resolved valuesets
 */
export async function batchFetchVsacValuesets(oidsToFetch: string[]): Promise<{
  vsacResults: VsacResult[];
  errors: VsacErrorResult[];
}> {
  const valuesetPromises = oidsToFetch.map(async (oid) => {
    const vs = await getVSACValueset(oid);
    return { vs: vs, oid: oid };
  });
  const resolvedPromises: { vs: FhirFetchResult; oid: string }[] = [];
  let errors: VsacErrorResult[] = [];

  const settledPromises = await Promise.allSettled(valuesetPromises);

  settledPromises.forEach((r, i) => {
    if (r.status === "fulfilled") {
      resolvedPromises.push(r.value);
    } else {
      const erroringOid = oidsToFetch[i];
      console.error(`VSAC promise with OID ${erroringOid} failed to resolve`);
      errors.push({
        error: r.reason,
        // preserve the OID associated with the rejected promise for future bookkeeping
        oid: erroringOid,
      });
    }
  });

  const valuesets = resolvedPromises.filter(
    (item): item is { vs: ValueSet; oid: string } => isFhirValueset(item.vs),
  );

  if (valuesets.length !== resolvedPromises.length) {
    console.warn("Some fetches to VSAC resolved with an error");

    const unsuccessfulFetches = resolvedPromises
      .filter(
        (item): item is { vs: OperationOutcome; oid: string } =>
          !isFhirValueset(item.vs),
      )
      .map((i) => {
        console.error(
          `VSAC fetch with OID ${i.oid} resolved with OperationOutcome issue ${i.vs.issue}`,
        );

        return { error: i.vs, oid: i.oid };
      });
    errors.push(...unsuccessfulFetches);
  }

  return { vsacResults: valuesets, errors: errors };
}

/**
 * Given the eRSD payload condition information, fetch all the relevant VSAC valuesets
 * needed to populate the rest of the database.
 *
 * @param ersdPayload - the eRSD payload to inform which valuesets needing fetching
 * @param batchSize - batch size to not overwhelm the VSAC API - 100 by default
 * @returns Bundle<Resource>[] of successful VSAC valuesets
 * @throws Error if any of the promises fail to resolve / resolve with OperationOutcome
 */
export async function fetchValueSetsFromVsac(
  ersdPayload: ErsdPayload,
  batchSize: number,
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
  let batch = 1;

  console.log(
    `Attempting fetch for ${ersdPayload.oids?.length} VSAC value sets.`,
  );

  let vsacValuesets: VsacResult[] = [];
  let attempt = 0;
  while (
    startIdx < ersdPayload.oids.length &&
    attempt < VSAC_MAX_FETCH_RETRIES
  ) {
    console.log(
      `Attempt ${attempt + 1} for batch ${batch}: IDs ${startIdx} to ${lastIdx}`,
    );
    const oidsToFetch = ersdPayload.oids.slice(
      startIdx,
      Math.min(lastIdx, ersdPayload.oids.length),
    );

    let batchValuesets = await batchFetchVsacValuesets(oidsToFetch);
    const { vsacResults, errors } = batchValuesets;

    if (errors.length > 0) {
      if (attempt < VSAC_MAX_FETCH_RETRIES) {
        const backoffMs = VSAC_RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `VSAC condition lookup for OID batch starting with ${oidsToFetch[0]} and ending with ${oidsToFetch[oidsToFetch.length - 1]} failed ` +
            `(attempt ${attempt + 1}/${VSAC_MAX_FETCH_RETRIES + 1}): ` +
            `Retrying in ${backoffMs}ms.`,
        );
        attempt += 1;
        await sleep(backoffMs);
        continue;
      } else {
        throw new Error(
          `VSAC fetch returned errors in batch ${batch}. Verify UMLS_API_KEY is valid and not expired.`,
        );
      }
    }

    vsacValuesets.push(...vsacResults);
    startIdx += batchSize;
    lastIdx += batchSize;
    batch += 1;
    attempt = 0;
  }

  return vsacValuesets;
}

/**
 * Function to fetch valuesets from VSAC and map them to internal valueset representation
 * @param ersdPayload - the eRSD payload to inform which valuesets needing fetching
 * @param batchSize - batch size to not overwhelm the VSAC API - 100 by default
 * @returns DibbsValueset[] - an array of DibbsValueset objects
 */
export async function fetchDibbsValueSets(
  ersdPayload: ErsdPayload,
  batchSize = VSAC_FETCH_BATCH_SIZE,
) {
  const vsacValueSets = await fetchValueSetsFromVsac(ersdPayload, batchSize);
  const oidsToVersion: Map<String, String> = new Map<String, String>();
  const retiredOids: Set<String> = new Set<String>();

  const internalValueSets = vsacValueSets.map((v) => {
    const eRSDType: ErsdConceptType = ersdPayload.oidToErsdResourceMap.get(
      v.oid,
    ) as ErsdConceptType;

    const internalValueSet = translateVSACToInternalValueSet(v.vs, eRSDType);

    oidsToVersion.set(v.oid, internalValueSet.valueSetVersion);

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
