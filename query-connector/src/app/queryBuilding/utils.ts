import { ValueSet } from "../constants";
import { GroupedValueSet } from "../query/components/customizeQuery/customizeQueryUtils";

// The structure of the data that's coming from the backend
export type ConditionIdToNameMap = {
  [conditionId: string]: string;
};
export type CategoryToConditionArrayMap = {
  [categoryName: string]: ConditionIdToNameMap[];
};

export type ConditionIdToValueSetArray = {
  [conditionId: string]: ValueSet[];
};

export type ValueSetsByGroup = {
  labs: {
    [name: string]: GroupedValueSet;
  };
  medications: {
    [name: string]: GroupedValueSet;
  };
  conditions: {
    [name: string]: GroupedValueSet;
  };
};

export type ConditionToValueSetMap = {
  [conditionId: string]: ValueSetsByGroup;
};
// The transform structs for use on the frontend, which is a grandparent - parent
// - child mapping from category (indexed by name) - conditions (indexed by condition ID)
// and - condition option (name and whether to include it in the query we're building).
export type ConditionOption = {
  name: string;
  include: boolean;
};
export type ConditionOptionMap = {
  [conditionId: string]: ConditionOption;
};
export type CategoryNameToConditionOptionMap = {
  [categoryName: string]: ConditionOptionMap;
};

/**
 * Translation function format backend response to something more manageable for the
 * frontend
 * @param fetchedData - data returned from the backend function grabbing condition <>
 * category mapping
 * @returns - The data in a CategoryNameToConditionOptionMap shape
 */
export function mapFetchedDataToFrontendStructure(fetchedData: {
  [categoryName: string]: ConditionIdToNameMap[];
}) {
  const result: CategoryNameToConditionOptionMap = {};
  Object.entries(fetchedData).forEach(
    ([categoryName, conditionIdToNameMapArray]) => {
      const curCategoryMap: ConditionOptionMap = {};
      conditionIdToNameMapArray.forEach((e) => {
        (curCategoryMap[Object.keys(e)[0]] = {
          name: Object.values(e)[0],
          include: false,
        }),
          (result[categoryName] = curCategoryMap);
      });
    },
  );
  return result;
}

/**
 * Filtering function that checks filtering at the category and the condition level
 * @param filterString - string to filter by
 * @param fetchedConditions - unfiltered list of conditions fetched from the backend
 * @returns - The subset of fetched conditions that contain the filter string
 */
export function filterSearchByCategoryAndCondition(
  filterString: string,
  fetchedConditions: CategoryNameToConditionOptionMap,
): CategoryNameToConditionOptionMap {
  const result: CategoryNameToConditionOptionMap = {};

  Object.entries(fetchedConditions).forEach(
    ([categoryName, conditionNameArray]) => {
      if (
        categoryName
          .toLocaleLowerCase()
          .includes(filterString.toLocaleLowerCase())
      ) {
        result[categoryName] = fetchedConditions[categoryName];
      }
      Object.entries(conditionNameArray).forEach(
        ([conditionId, conditionNameAndInclude]) => {
          if (
            conditionNameAndInclude.name
              .toLocaleLowerCase()
              .includes(filterString.toLocaleLowerCase())
          ) {
            result[categoryName] = result[categoryName] ?? {};
            result[categoryName][conditionId] = conditionNameAndInclude;
          }
        },
      );
    },
  );

  return result;
}

/**
 * Utility method that strips the (disorder) string that comes back from the
 * APHL list on the query building page
 * @param diseaseName - name of the disease
 * @returns A disease display string for display
 */
export function formatDiseaseDisplay(diseaseName: string) {
  return diseaseName.replace("(disorder)", "");
}

/**
 * Utility method that returns the number of concepts associated
 * with a given value set, with the option to return only
 * concepts marked as included
 * @param valueSet - the GroupedValueSet to run the tally on
 * @param filterInclude - boolean to indicate whether to only count
 * included concepts (defaults to false)
 * @returns A number indicating the tally of relevant concpets
 */
export function tallyConceptsForSingleValueSet(
  valueSet: GroupedValueSet,
  filterInclude?: boolean,
) {
  const selectedTotal = valueSet.items.reduce((sum, vs) => {
    const includedConcepts = !!filterInclude
      ? vs.concepts.filter((c) => c.include)
      : vs.concepts;
    sum += includedConcepts.length;
    return sum;
  }, 0);

  return selectedTotal;
}

/**
 * Utility method that returns the total number of concepts associated
 * with a selection of ValueSets, with the option to return only
 * concepts marked as included
 * @param valueSets - the array of GroupedValueSets to run the tally on
 * @param filterInclude - boolean to indicate whether to only count
 * included concepts
 * @returns A number indicating the tally of relevant concpets
 */
export function tallyConcpetsForValueSetGroup(
  valueSets: GroupedValueSet[],
  filterInclude?: boolean,
) {
  const selectedTotal = valueSets.reduce((sum, valueSet) => {
    const childTotal = tallyConceptsForSingleValueSet(valueSet, filterInclude);
    sum += childTotal;
    return sum;
  }, 0);
  return selectedTotal;
}

/**
 * Utility method that marks all concepts as included for
 * a given ValueSet
 * @param input - the ValueSet to update
 * @returns the updated ValueSet
 */
export const batchToggleConcepts = (input: ValueSet) => {
  input.concepts.forEach((concept) => {
    const currentStatus = concept.include;
    concept.include = !currentStatus;
  });

  return input;
};
