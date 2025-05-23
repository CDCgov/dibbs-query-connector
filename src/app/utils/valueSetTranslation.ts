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
