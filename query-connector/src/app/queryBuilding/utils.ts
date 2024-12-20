import { DibbsConceptType, ValueSet } from "../constants";
import {
  ValueSetGrouping,
  groupValueSetsByNameAuthorSystem,
  groupValueSetsByConceptType,
} from "../query/components/customizeQuery/customizeQueryUtils";

// The structure of the data that's coming from the backend
export type ConditionIdToNameMap = {
  [conditionId: string]: string;
};

export type QueryDetailsResult = {
  query_name: string;
  id: string;
  query_data: { [condition_name: string]: { [valueSetId: string]: ValueSet } };
  conditions_list: string[];
};

export type CategoryToConditionArrayMap = {
  [categoryName: string]: ConditionIdToNameMap[];
};

export type ConditionIdToValueSetArrayMap = {
  [conditionId: string]: ValueSet[];
};

export type ValueSetGroupingByConceptType = {
  labs: {
    [name: string]: ValueSetGrouping;
  };
  medications: {
    [name: string]: ValueSetGrouping;
  };
  conditions: {
    [name: string]: ValueSetGrouping;
  };
};

export type ConditionToValueSetGroupingMap = {
  [conditionId: string]: ValueSetGroupingByConceptType;
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

export const EMPTY_QUERY_SELECTION = { queryId: "", queryName: "" };

/**
 * Translation function format backend response to something more manageable for the
 * frontend
 * @param fetchedData - data returned from the backend function grabbing condition <>
 * category mapping
 * @returns - The data in a CategoryNameToConditionOptionMap shape
 */
export function groupConditionDataByCategoryName(fetchedData: {
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
 * Utility function to reverse the category : name: ID mapping between our conditions structure
 * @param fetchedDate - data returned from the backend function grabbing condition <>
 * category mapping
 * @returns - The data in a CategoryNameToConditionOptionMap shape
 */
export function generateConditionNameToIdAndCategoryMap(
  fetchedDate: CategoryNameToConditionOptionMap,
) {
  const result: {
    [conditionName: string]: {
      conditionId: string;
      category: string;
    };
  } = {};
  Object.entries(fetchedDate).forEach(([categoryName, conditionOptionMap]) => {
    Object.entries(conditionOptionMap).forEach(([conditionId, optionMap]) => {
      result[optionMap.name] = {
        conditionId: conditionId,
        category: categoryName,
      };
    });
  });
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
  valueSet: ValueSetGrouping,
  filterInclude?: boolean,
) {
  if (
    valueSet.valueSetName === "Syphilis (Organism or Substance in Lab Results)"
  ) {
    console.log("valueSet", valueSet);
  }
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
export function tallyConceptsForValueSetGroup(
  valueSets: ValueSetGrouping[],
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

/**
 * Utility function to generate a three-layer condition : labs / conditions/
 * medications : {valueSetName: ValueSetGrouping} map
 * @param conditionIdToValueSetArrayMap map of condition IDs to ValueSet[]
 * @returns Map of {[conditionId]: {[valueSetName]: ValueSetGrouping} }
 */
export function groupValueSetGroupingByConditionId(
  conditionIdToValueSetArrayMap: ConditionIdToValueSetArrayMap,
): ConditionToValueSetGroupingMap {
  const results: ConditionToValueSetGroupingMap = {};

  Object.entries(conditionIdToValueSetArrayMap).forEach(
    ([conditionId, valueSetArray]) => {
      const valueSetsByConceptType = groupValueSetsByConceptType(valueSetArray);
      const curConditionGrouping = generateValueSetGroupingsByConceptType(
        valueSetsByConceptType,
      );
      results[conditionId] = curConditionGrouping;
    },
  );

  return results;
}

function generateValueSetGroupingsByConceptType(valueSetsByConceptType: {
  [key in DibbsConceptType]: ValueSet[];
}) {
  return Object.keys(valueSetsByConceptType).reduce(
    (acc, key) => {
      const valueSetGroupings = groupValueSetsByNameAuthorSystem(
        valueSetsByConceptType[key as DibbsConceptType],
      );

      acc[key as DibbsConceptType] = valueSetGroupings;
      return acc;
    },
    {} as {
      [key in DibbsConceptType]: { [vsName: string]: ValueSetGrouping };
    },
  );
}
