import { DibbsConceptType, ValueSet } from "@/app/constants";

// valuesets that share the same name, author, system unique identifier
export type ValueSetGrouping = {
  valueSetName: string;
  author: string;
  system: string;
  items: ValueSet[];
};

type ValueSetNameAuthorSystem = string;
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
export function groupValueSetsByNameAuthorSystem(
  valueSetsToGroup: ValueSet[],
): Record<ValueSetNameAuthorSystem, ValueSetGrouping> {
  const results = valueSetsToGroup.reduce(
    (acc, row) => {
      // Check if both author and code_system are defined
      const author = row?.author;
      const system = row?.system;
      const valueSetName = row?.valueSetName;
      if (!author || !system || !valueSetName) {
        console.warn(
          `Skipping malformed row: Missing author (${author}) or system (${system}) for ValueSet (${row?.valueSetId})`,
        );
        return acc;
      }

      const groupKey = `${valueSetName}:${author}:${system}`;
      if (!acc[groupKey]) {
        acc[groupKey] = {
          valueSetName: valueSetName,
          author: author,
          system: system,
          items: [],
        };
      }
      acc[groupKey].items.push({
        valueSetId: row.valueSetId,
        valueSetVersion: row.valueSetVersion,
        valueSetName: row.valueSetName,
        valueSetExternalId: row.valueSetExternalId,
        author: row.author,
        system: row.system,
        ersdConceptType: row.ersdConceptType,
        dibbsConceptType: row.dibbsConceptType,
        includeValueSet: row.includeValueSet,
        concepts: row.concepts.map((c) => {
          return { ...c };
        }),
      });
      return acc;
    },
    {} as Record<ValueSetNameAuthorSystem, ValueSetGrouping>,
  );

  return results;
}

export type TypeIndexedGroupedValueSetDictionary = {
  [valueSetType in DibbsConceptType]: {
    [vsNameAuthorSystem: string]: ValueSetGrouping;
  };
};

/**
 * A helper function that takes all the ValueSetItems for a given condition,
 * parses them based on clinical code, and sorts them into the
 * ValueSetType buckets for the condition. The result is an dictionary
 * object, with index of labs, conditions, medications that we display on the
 * customize query page, where each dictionary is a separate accordion grouping
 * of ValueSetItems that users can select to filter their custom queries with
 * @param  vsArray - an array of ValueSets to group
 * @returns A dictionary of
 * dictionaries, where the first index is the ValueSetType, which indexes a
 * dictionary of GroupedValueSets. The subdictionary is indexed by
 * valueSetName:author:system
 */
export function mapValueSetsToValueSetTypes(vsArray: ValueSet[]) {
  const valueSetsByNameAuthorSystem = groupValueSetsByNameAuthorSystem(vsArray);
  const results: {
    [vsType in DibbsConceptType]: {
      [vsNameAuthorSystem: string]: ValueSetGrouping;
    };
  } = {
    labs: {},
    conditions: {},
    medications: {},
  };

  Object.entries(valueSetsByNameAuthorSystem).map(
    ([nameAuthorSystem, groupedValueSet]) => {
      const mappedSets = groupValueSetsByConceptType(groupedValueSet.items);

      Object.entries(mappedSets).forEach(([valueSetTypeKey, items]) => {
        // the sieving function below accounts for the case that a GroupedValueSet
        // might have items that belong to more than one ValueSetType.
        // In practice, this doesn't occur very often / will result in empty
        // GroupedValueSets (ie the groupings on the other tabs) that we don't
        // want to display, so we should filter those out.
        if (items.length > 0) {
          results[valueSetTypeKey as DibbsConceptType][nameAuthorSystem] = {
            ...groupedValueSet,
            items: items,
          };
        }
      });
    },
  );

  return results;
}

/**
 * Helper function to map an array of value sets into their lab, medication,
 * condition buckets to be displayed on the customize query page
 * @param valueSets - A list of value sets mapped from DB rows.
 * @returns Dict of list of rows containing only the predicate service type
 * mapped to one of "labs", "medications", or "conditions".
 */
export const groupValueSetsByConceptType = (
  valueSets: ValueSet[],
): { [vsType in DibbsConceptType]: ValueSet[] } => {
  const results: { [vsType in DibbsConceptType]: ValueSet[] } = {
    labs: [],
    medications: [],
    conditions: [],
  };
  (Object.keys(results) as Array<DibbsConceptType>).forEach((vsType) => {
    const itemsToInclude = valueSets.filter(
      (vs) => vs.dibbsConceptType === vsType,
    );
    results[vsType] = itemsToInclude;
  });

  return results;
};

/**
 * Utility function to count the number of labs / meds / conditions that we display
 * on the customize query page
 * @param obj a grouped ValueSet dictionary that we render as an individual accordion
 * @returns A count of the number of items in each of the DibbsConceptTypes
 */
export const countDibbsConceptTypeToVsMapItems = (obj: {
  [vsNameAuthorSystem: string]: ValueSetGrouping;
}) => {
  return Object.values(obj).reduce((runningSum, gvs) => {
    gvs.items.forEach((vs) => {
      runningSum += vs.concepts.length;
    });
    return runningSum;
  }, 0);
};
