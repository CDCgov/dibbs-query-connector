import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { ConceptTypeToDibbsVsMap } from "../../utils/valueSetTranslation";

// The structure of the data that's coming from the backend
export type ConditionsMap = {
  [conditionId: string]: {
    name: string;
    category: string;
  };
};

export type CategoryToConditionArrayMap = {
  [category: string]: {
    id: string;
    name: string;
  }[];
};

export type ConditionIdToValueSetArrayMap = {
  [conditionId: string]: DibbsValueSet[];
};

export type NestedQuery = {
  [conditionId: string]: ConceptTypeToDibbsVsMap;
};

export type QueryUpdateResult = {
  id: string;
  query_name: string;
  operation: "INSERT" | "UPDATE";
};
export type QueryDataColumn = {
  [conditionId: string]: { [valueSetId: string]: DibbsValueSet };
};
export type QueryTableResult = {
  queryName: string;
  queryId: string;
  queryData: QueryDataColumn;
  conditionsList: string[];
  immunization: boolean;
};

export const EMPTY_QUERY_SELECTION = {
  queryId: undefined,
  queryName: undefined,
};

export const EMPTY_CONCEPT_TYPE = {
  labs: {},
  conditions: {},
  medications: {},
};

/**
 * Utility method to get a display name for a category (if overridden),
 * or fall back to the raw name.
 * @param categoryName - raw category name from backend
 * @returns display name to show in UI
 */
export function formatCategoryDisplay(categoryName: string): string {
  const categoryDisplayMap: Record<string, string> = {
    "Sexually Transmitted Diseases": "Sexually Transmitted Diseases (STI)",
  };
  // Add more mappings as needed
  return categoryDisplayMap[categoryName] || categoryName;
}

/**
 * Filtering function that checks filtering at the category and the condition level
 * @param filterString - string to filter by
 * @param fetchedConditions - unfiltered list of conditions fetched from the backend
 * @returns - The subset of fetched conditions that contain the filter string
 */
export function filterSearchByCategoryAndCondition(
  filterString: string,
  fetchedConditions: CategoryToConditionArrayMap,
): CategoryToConditionArrayMap {
  const result: CategoryToConditionArrayMap = {};
  const unfilteredConditions = structuredClone(fetchedConditions);

  Object.entries(unfilteredConditions).forEach(
    ([categoryName, conditionArray]) => {
      const displayCategory = formatCategoryDisplay(categoryName);
      const filter = filterString.toLowerCase();

      if (
        categoryName.toLowerCase().includes(filter) ||
        displayCategory.toLowerCase().includes(filter)
      ) {
        result[categoryName] = conditionArray;
      } else {
        const matches = conditionArray.filter((c) =>
          formatDiseaseDisplay(c.name).toLowerCase().includes(filter),
        );
        if (matches.length > 0) {
          result[categoryName] = matches;
        }
      }
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
export function formatDiseaseDisplay(diseaseName: string): string {
  const diseaseDisplayMap: Record<string, string> = {
    "Human immunodeficiency virus infection (disorder)":
      "Human immunodeficiency virus infection (HIV)",
  };
  return (
    diseaseDisplayMap[diseaseName] ||
    diseaseName.replace("(disorder)", "").trim()
  );
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
  valueSet: DibbsValueSet,
  filterInclude?: boolean,
) {
  const selectedTotal = valueSet.concepts.reduce((sum, concept) => {
    const addToTally = !filterInclude
      ? 1 // add every item
      : concept.include
        ? 1
        : 0; // only add items marked as included

    sum += addToTally;

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
export function tallyConceptsForValueSetArray(
  valueSets: DibbsValueSet[],
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
export const batchToggleConcepts = (input: DibbsValueSet) => {
  input.concepts.forEach((concept) => {
    const currentStatus = concept.include;
    concept.include = !currentStatus;
  });

  return input;
};
