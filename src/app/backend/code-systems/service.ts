"use server";
import { Bundle, OperationOutcome, Parameters } from "fhir/r4";
import { MISSING_API_KEY_LITERAL } from "../../constants";
import { encode } from "base-64";
import {} from "../db-creation/service";

export type ErsdOrVsacResponse = Bundle | Parameters | OperationOutcome;

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
 * Fetches the eRSD Specification from the eRSD API. This function requires an API key
 * to access the eRSD API. The API key can be obtained at https://ersd.aimsplatform.org/#/api-keys.
 * @param eRSDVersion - The version of the eRSD specification to retrieve. Defaults to v2.
 * @returns The eRSD Specification as a FHIR Bundle or an OperationOutcome if an error occurs.
 */
export async function getERSD(
  eRSDVersion: number = 3,
): Promise<ErsdOrVsacResponse> {
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
export async function getVSACValueSet(
  oid: string,
  searchStructType: string = "valueset",
  codeSystem?: string,
): Promise<ErsdOrVsacResponse> {
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
      Authorization: "Basic " + encode(username + ":" + umlsKey),
      "Content-Type": "application/fhir+json",
    }),
  });
  if (response.status === 200) {
    const data = (await response.json()) as Bundle;
    return data;
  } else {
    // VSAC sends some errors, like the 401 for a bad API key, with an empty
    // body, so don't assume the body is JSON.
    const body = await response.text();
    let detail = body || response.statusText;
    try {
      detail = JSON.parse(body)?.issue?.[0]?.diagnostics ?? detail;
    } catch {
      // Not JSON; keep the raw body or status text.
    }
    return {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          // "security" lets callers tell a rejected API key apart from other
          // failures and stop instead of retrying.
          code: response.status === 401 ? "security" : "processing",
          diagnostics: detail
            ? `${response.status}: ${detail}`
            : `${response.status}`,
        },
      ],
    } as OperationOutcome;
  }
}
