import { OperationOutcome, ValueSet } from "fhir/r4";
import { ConditionStruct } from "@/app/backend/db-creation/seedSqlStructs";
import { INVALID_API_KEY_LITERAL, MISSING_API_KEY_LITERAL } from "@/constants";
import { createErsdPayload } from "./process-data";
import {
  VSAC_MAX_FETCH_RETRIES,
  VSAC_RETRY_BASE_DELAY_MS,
  ErsdPayload,
  VsacErrorResult,
  isFhirBundle,
  isFhirValueset,
  sleep,
  VsacResult,
  isParameters,
} from "./utils";
import { getERSD, getVsacCondition, getVsacValueSet } from "./api-calls";

/**
 * Wrapper function to fetch the eRSD, throwing an error if the fetch is unsuccessful.
 * @returns the eRSD bundle
 * @throws an error with the OperationOutcome diagnostics if the fetch fails
 */
export async function fetchAndProcessErsdResources() {
  console.log("📡 Fetching ERSD resources");
  const ersdResponse = await getERSD();

  if (isFhirBundle(ersdResponse)) {
    return ersdResponse;
  }

  throw Error(ersdResponse.issue[0].diagnostics);
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
      const vsacCondition = await getVsacCondition(c[0], c[1]);

      // getVSACValueSet doesn't throw on a non-200 from VSAC; it resolves to
      // an OperationOutcome instead. A 5xx/429 is usually a transient blip on
      // the same constrained egress path, so retry it like a transport
      // failure. On the final attempt we fall through and build the struct
      // from whatever we got (an empty version), preserving the prior
      // tolerate-and-continue behavior rather than aborting the whole seed on
      // a persistently failing condition lookup.
      if (!vsacCondition.success) {
        // throw the appropriate error to trigger retry correctly.
        const issue = vsacCondition.data?.issue[0];
        if (issue.code === "security") {
          throw new Error("VSAC rejected the UMLS API key", {
            cause: INVALID_API_KEY_LITERAL,
          });
        }

        if (attempt < VSAC_MAX_FETCH_RETRIES) {
          const diagnostics = issue?.diagnostics ?? "unknown VSAC error";
          throw new Error(`VSAC returned an error response: ${diagnostics}`);
        }
      }

      const params = vsacCondition.data;
      let version = ""; // fallback in cases where VSAC errors

      if (isParameters(params)) {
        const versionHolder = (params.parameter || []).find(
          (p) => p.name === "version",
        );
        const versionArray = (versionHolder?.valueString || "").split("/");
        version = versionArray[versionArray.length - 1];
      }

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
      if (
        e instanceof Error &&
        (e.cause === MISSING_API_KEY_LITERAL ||
          e.cause === INVALID_API_KEY_LITERAL)
      ) {
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
export async function batchFetchVsacValuesets(oidsToFetch: string[]): Promise<{
  vsacResults: VsacResult[];
  errors: VsacErrorResult[];
}> {
  let errors: VsacErrorResult[] = [];

  const valuesetPromises = oidsToFetch.map(async (oid) => {
    const vs = await getVsacValueSet(oid);
    let result = vs.data;

    return { result: result, oid: oid };
  });

  const settledPromises = await Promise.allSettled(valuesetPromises);
  const resolvedPromises: {
    result: ValueSet | OperationOutcome;
    oid: string;
  }[] = [];

  settledPromises.forEach((r, i) => {
    const promiseOid = oidsToFetch[i];

    if (r.status === "fulfilled") {
      if (isFhirValueset(r.value.result)) {
        resolvedPromises.push(r.value);
      } else {
        // the API can respond with an OperationOutcome (something errored on the FHIR server)
        // while still settling the result, in which case, add directly to the error array
        errors.push({ error: r.value.result, oid: promiseOid });
      }
    } else {
      console.error(`VSAC promise with OID ${promiseOid} failed to resolve`);
      // or the call itself can error, in which case, map it to the OperationOutcome object
      // first before adding it to the error array

      const rejectedReason = r.reason;
      let code = "processing";
      let diagnostics = rejectedReason;

      if (rejectedReason instanceof Error) {
        const isApiKeyError =
          rejectedReason.cause === MISSING_API_KEY_LITERAL ||
          rejectedReason.cause === INVALID_API_KEY_LITERAL;

        code = isApiKeyError ? "security" : "processing";
        diagnostics = rejectedReason.message;
      }

      errors.push({
        error: {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: code,
              diagnostics: diagnostics,
            },
          ],
        } as OperationOutcome,

        // preserve the OID associated with the rejected promise for future bookkeeping
        oid: promiseOid,
      });
    }
  });

  const valuesets = resolvedPromises.filter(
    (item): item is { result: ValueSet; oid: string } =>
      isFhirValueset(item.result),
  );

  return {
    vsacResults: valuesets.map((v) => {
      return { vs: v.result, oid: v.oid };
    }),
    errors: errors,
  };
}

async function handleVsacRetry(
  errors: VsacErrorResult[],
  attempt: number,
  maxRetries: number,
  curBatch: number,
  oidsToFetch: string[],
) {
  // throw immediately if any of the returned errors have a security flag
  // since retries won't resolve credential issues
  if (
    errors
      .map((e) => e.error.issue[0])
      .some((reason) => reason.code === "security")
  ) {
    throw new Error("VSAC API key invalid or missing", {
      cause: INVALID_API_KEY_LITERAL,
    });
  }

  if (attempt >= maxRetries) {
    throw new Error(
      `VSAC fetch failed after ${maxRetries + 1} attempts on batch ${curBatch}, beginning with ${oidsToFetch[0]} and ending with ${oidsToFetch[oidsToFetch.length - 1]}. Verify VSAC service is healthy.`,
    );
  }

  const backoffMs = VSAC_RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
  console.warn(
    `VSAC condition lookup for OID batch starting with ${oidsToFetch[0]} and ending with ${oidsToFetch[oidsToFetch.length - 1]} failed ` +
      `(attempt ${attempt + 1}/${maxRetries + 1}): ` +
      `Retrying in ${backoffMs}ms.`,
  );
  attempt += 1;
  await sleep(backoffMs);
}
/**
 * Given the eRSD payload condition information, fetch all the relevant VSAC valuesets
 * needed to populate the rest of the database. Default configured with retries and backoff
 * to guard against API flakiness.
 *
 * @param ersdPayload - the eRSD payload to inform which valuesets needing fetching
 * @param batchSize - batch size to not overwhelm the VSAC API - 100 by default
 * @param maxRetries - Retry attempts to not overwhelm the VSAC API - 3 by default
 * @returns Bundle<Resource>[] of successful VSAC valuesets
 * @throws Error if any of the promises fail to resolve / resolve with OperationOutcome
 */
export async function fetchValueSetsFromVsac(
  ersdPayload: ErsdPayload,
  batchSize: number,
  maxRetries = VSAC_MAX_FETCH_RETRIES,
) {
  let startIdx = 0;
  let lastIdx = startIdx + batchSize;
  let batch = 1;
  let attempt = 0;
  let vsacValuesets: VsacResult[] = [];

  console.info(
    `Attempting fetch for ${ersdPayload.oids?.length} VSAC value sets.`,
  );
  while (startIdx < ersdPayload.oids.length) {
    const boundedLastIdx = Math.min(lastIdx, ersdPayload.oids.length);

    console.info(
      `Attempt ${attempt + 1} for batch ${batch}: IDs ${startIdx} to ${boundedLastIdx}`,
    );
    const oidsToFetch = ersdPayload.oids.slice(startIdx, boundedLastIdx);

    const { vsacResults, errors } = await batchFetchVsacValuesets(oidsToFetch);

    if (errors.length > 0) {
      await handleVsacRetry(errors, attempt, maxRetries, batch, oidsToFetch);
      attempt += 1;
    } else {
      vsacValuesets.push(...vsacResults);
      startIdx += batchSize;
      lastIdx += batchSize;
      batch += 1;
      attempt = 0;
    }
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
