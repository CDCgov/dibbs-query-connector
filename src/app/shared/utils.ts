import { QueryResultRow } from "pg";
import { DibbsValueSet } from "../models/entities/valuesets";
import { Concept } from "../models/entities/concepts";

/**
 * Maps the results returned from the DIBBs value set and coding system database
 * into a collection of value sets, each containing one or more Concepts build out
 * of the coding information in the DB.
 * @param rows The Rows returned from the ValueSet table.
 * @returns A list of ValueSets, which hold the Concepts pulled from the DB.
 */
export const groupConditionConceptsIntoValueSets = (rows: QueryResultRow[]) => {
  // Create groupings of rows (each of which is a single Concept) by their ValueSet ID
  const vsIdGroupedRows = rows.reduce((conceptsByVSId, r) => {
    if (!(r["valueset_id"] in conceptsByVSId)) {
      conceptsByVSId[r["valueset_id"]] = [];
    }

    // if we already added the concept, don't add it again
    // this prevents errors that occur on the code library page
    // due to value sets that are affiliated with multiple
    // conditions. For query building, we call this on an already-filtered
    // list of value sets for a single condition, so that behavior stays the same.
    if (
      !conceptsByVSId[r["valueset_id"]].some(
        (item: Concept) => item.code == r.code,
      )
    ) {
      conceptsByVSId[r["valueset_id"]].push(r);
    }

    return conceptsByVSId;
  }, {});

  // Each "prop" of the struct is now a ValueSet ID
  // Iterate over them to create formal Concept Groups attached to a formal VS
  const valueSets = Object.keys(vsIdGroupedRows).map((vsID) => {
    const conceptGroup: QueryResultRow[] = vsIdGroupedRows[vsID];
    const valueSet = mapStoredValueSetIntoInternalValueset(conceptGroup);
    return valueSet;
  });
  return valueSets;
};

// TODO?: Type the input param more explicitly to not be a generic DB return?
/**
 *
 * @param conceptGroup - a grouping of concepts fetched from various coding
 * systems that share the same ValueSet ID
 * @returns a ValueSet shaped to our internal ValueSet structure
 */
function mapStoredValueSetIntoInternalValueset(
  conceptGroup: QueryResultRow[],
): DibbsValueSet {
  // For info that should be the same at the valueset-level, just use the first
  // fetched concept to populate
  const storedConcept = conceptGroup[0];
  const nonEmptyConcepts = conceptGroup.filter((c) => c["code"] !== null);

  const valueSet: DibbsValueSet = {
    valueSetId: storedConcept["valueset_id"],
    valueSetVersion: storedConcept["version"],
    valueSetName: storedConcept["valueset_name"],
    // External ID might not be defined for user-defined valuesets
    valueSetExternalId: storedConcept["valueset_external_id"]
      ? storedConcept["valueset_external_id"]
      : undefined,
    author: storedConcept["author"],
    system: storedConcept["code_system"],
    ersdConceptType: storedConcept["type"] ? storedConcept["type"] : undefined,
    dibbsConceptType: storedConcept["dibbs_concept_type"],
    includeValueSet: conceptGroup
      .map((c) => c["include"])
      // if every concept is explicitly set to false, don't include this valueset.
      // otherwise (even if inclusion is undefined, which by default it will be)
      // assume we want to include that valueset
      .every((v) => v === false)
      ? false
      : true,
    concepts: nonEmptyConcepts.map((c) => {
      return {
        code: c["code"],
        display: c["display"],
        include: c["include"] ?? true,
        internalId: c["internal_id"],
      };
    }),
    userCreated: storedConcept["user_created"] ?? false,
  };

  const conditionId = storedConcept["condition_id"];
  if (conditionId) {
    valueSet["conditionId"] = conditionId;
  }
  if (conditionId == "custom_condition") {
    valueSet["userCreated"] = true;
  }

  return valueSet;
}

export const DEFAULT_TIME_WINDOW = {
  timeWindowNumber: 1,
  timeWindowUnit: "day",
};

/**
 * Fetches a URL without SSL verification. This is useful for
 * FHIR servers that are not using SSL or have self-signed certificates.
 * @param url The URL to fetch.
 * @param options The options to pass to the fetch function.
 * @returns The response from the fetch function.
 */
export async function fetchWithoutSSL(url: string, options: RequestInit = {}) {
  const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  try {
    const response = await fetch(url, options);
    return response;
  } finally {
    // Restore the original environment variable value
    if (originalValue === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;
    }
  }
}
