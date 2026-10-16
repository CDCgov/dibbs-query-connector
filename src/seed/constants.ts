// Number of retry attempts for a single VSAC condition lookup that fails with a
// transient transport error (e.g. undici "fetch failed" from a connection reset
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
