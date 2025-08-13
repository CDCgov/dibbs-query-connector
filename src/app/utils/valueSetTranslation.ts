import { QueryResultRow } from "pg";
import { Concept } from "../models/entities/concepts";
import { DibbsConceptType, DibbsValueSet } from "../models/entities/valuesets";

export type ConceptTypeToDibbsVsMap = {
  [dibbsConceptType in DibbsConceptType]: {
    [vsId: string]: DibbsValueSet;
  };
};

type VsNameAuthorSystem = string;
/**
 * Utility function to extract the unique identifier for a ValueSetGrouping
 * @param vsGroup - A ValueSetGrouping to identify
 * @returns the vsName:Author:System key that should uniquely identify a
 * valueset grouping
 */
export function getNameAuthorSystemFromVSGrouping(vsGroup: DibbsValueSet) {
  return `${vsGroup.valueSetName}:${vsGroup.author}:${vsGroup.system}`;
}

/**
 * Helper function that takes an array of value set items and groups them using
 * a combination of the value set name, author, and system to create a unique
 * grouping of items. These groups are displayed as individual accordions on
 * the customize query page
 * @param valueSetsToGroup - an array of value sets to group
 * @returns - a dictionary of value sets, where the index are the unique combinations
 * of valueSetName:author:system and the values are all the value set items that
 * share those identifiers in common, structed as a GroupedValueSet
 */
export function groupValueSetsByVsId(
  valueSetsToGroup: DibbsValueSet[],
): Record<VsNameAuthorSystem, DibbsValueSet> {
  const results = valueSetsToGroup.reduce(
    (acc, row) => {
      // Check if both author and code_system are defined
      const author = row?.author;
      const system = row?.system;
      const valueSetName = row?.valueSetName;
      const vsId = row?.valueSetId;
      if (!author || !system || !valueSetName) {
        console.warn(
          `Skipping malformed row: Missing author (${author}) or system (${system}) for ValueSet (${row?.valueSetId})`,
        );
        return acc;
      }
      const groupKey = vsId;

      acc[groupKey] = {
        valueSetId: row.valueSetId,
        valueSetVersion: row.valueSetVersion,
        valueSetName: row.valueSetName,
        valueSetExternalId: row.valueSetExternalId,
        author: row.author,
        system: row.system,
        ersdConceptType: row.ersdConceptType,
        dibbsConceptType: row.dibbsConceptType,
        includeValueSet: row.includeValueSet,
        userCreated: row.userCreated,
        concepts: row.concepts.map((c) => {
          return { ...c };
        }),
      };
      return acc;
    },
    {} as Record<VsNameAuthorSystem, DibbsValueSet>,
  );

  return results;
}
/**
 * Utility function that groups an array of DibbsValueSets into the name / author
 * / system groupings and then sorts them into their DibbsConceptType buckets
 * buckets
 * @param vsArray - an array of DibbsValueSets
 * @returns - {[DibbsConceptType]: ValueSetGrouping (VS's that share name / author / system) }
 */
export function generateValueSetGroupingsByDibbsConceptType(
  vsArray: DibbsValueSet[],
) {
  const valueSetsByConceptType = groupValueSetsByConceptType(vsArray);
  return generateValueSetGroupingsByConceptType(valueSetsByConceptType);
}

/**
 * Utility function to map a {dibbsConceptType: ValueSet[]} map into a
 * { dibbsConceptType: {valueSetNameAuthorSystem}: ValueSetGrouping } map
 * @param  valueSetsByConceptType - map of { dibbsConceptType : ValueSet[] }
 * @returns a { dibbsConceptType: {valueSetNameAuthorSystem}: ValueSetGrouping } map
 */
function generateValueSetGroupingsByConceptType(valueSetsByConceptType: {
  [key in DibbsConceptType]: DibbsValueSet[];
}) {
  return Object.keys(valueSetsByConceptType).reduce(
    (acc, key) => {
      const valueSetGroupings = groupValueSetsByVsId(
        valueSetsByConceptType[key as DibbsConceptType],
      );

      acc[key as DibbsConceptType] = valueSetGroupings;
      return acc;
    },
    {} as {
      [key in DibbsConceptType]: { [vsName: string]: DibbsValueSet };
    },
  );
}

/**
 * Helper function to map an array of value sets into their DibbsConceptType
 * buckets
 * @param valueSets - A list of value sets
 * @returns Dict of list of rows containing only the predicate service type
 * mapped to one of the DibbsConceptTypes.
 */
export const groupValueSetsByConceptType = (
  valueSets: DibbsValueSet[],
): { [vsType in DibbsConceptType]: DibbsValueSet[] } => {
  return valueSets.reduce(
    (result, vs) => {
      const curConceptType = vs.dibbsConceptType;
      if (Object.keys(result).includes(curConceptType)) {
        result[curConceptType].push(vs);
      } else {
        result[curConceptType] = [vs];
      }
      return result;
    },
    {} as { [vsType in DibbsConceptType]: DibbsValueSet[] },
  );
};

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
