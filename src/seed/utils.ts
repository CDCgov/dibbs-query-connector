// Number of retry attempts for a single VSAC condition lookup that fails with a
// transient transport error (e.g. undici "fetch failed" from a connection reset

import { Bundle, OperationOutcome, Parameters, ValueSet } from "fhir/r4";

// or timeout). Total attempts = retries + 1.
export const VSAC_MAX_FETCH_RETRIES = 3;
// Base delay for exponential backoff between condition-lookup retries.
export const VSAC_RETRY_BASE_DELAY_MS = 1000;
// Courtesy pause between batches of condition lookups so we don't overwhelm VSAC.
export const VSAC_BATCH_DELAY_MS = 1000;
// batch for how many concurrent fetches to VSAC we should perform
export const VSAC_FETCH_BATCH_SIZE = 100;

export type ErsdCondition = {
  code: string;
  system: string;
  text: string;
  valueset_id: string;
};

export type ErsdPayload = {
  oids: Array<string>;
  oidToErsdResourceMap: Map<string, string>;
  conditions: Array<ErsdCondition>;
};

export type VsacErrorResult = {
  error: OperationOutcome;
  oid: string;
};

export type VsacResult = {
  vs: ValueSet;
  oid: string;
};

export type VsacValueSetResponse = OperationOutcome | ValueSet;
export type VsacParameterResponse = OperationOutcome | Parameters;

/**
 * Typeguard for whether a response returns an appropriate ValueSet response
 * or not
 * @param response response from VSAC API
 * @returns Type-narrowed value for whether the response is successful or an
 * OperationOutcome
 */
export function isFhirValueset(
  response: VsacValueSetResponse,
): response is ValueSet {
  return (response as ValueSet)?.resourceType === "ValueSet";
}

/**
 * Typeguard for whether a response returns an error OperationOutcome response
 * or not
 * @param response response from eRSD API
 * @returns Type-narrowed value for whether the response is an OperationOutcome
 */
export function isParameters(
  response: VsacParameterResponse,
): response is Parameters {
  return (response as Parameters)?.resourceType === "Parameters";
}

export type ErsdResponse = OperationOutcome | Bundle;

/**
 * Typeguard for whether a response returns an appropriate Bundle response
 * or not
 * @param response response from eRSD API
 * @returns Type-narrowed value for whether the response is successful or an
 * OperationOutcome
 */
export function isFhirBundle(response: ErsdResponse): response is Bundle {
  return (response as Bundle)?.resourceType === "Bundle";
}

/**
 * Sleeps for the given number of milliseconds.
 * @param ms Milliseconds to wait.
 * @returns A promise that resolves once the delay elapses.
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
