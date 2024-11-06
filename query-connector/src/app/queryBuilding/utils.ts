export type ConditionIdToNameMap = {
  [conditionId: string]: string;
};

export type CategoryToConditionArrayMap = {
  [categoryName: string]: ConditionIdToNameMap[];
};
export type ConditionDetails = {
  name: string;
  include: boolean;
};
export type ConditionDetailsMap = {
  [conditionId: string]: ConditionDetails;
};

export type CategoryNameToConditionDetailsMap = {
  [categoryName: string]: ConditionDetailsMap;
};

/**
 * Translation function format backend response to something more manageable for the
 * frontend
 * @param fetchedData - data returned from the backend function grabbing condition <>
 * category mapping
 * @returns - The data in a CategoryNameToConditionDetailsMap shape
 */
export function mapFetchedDataToFrontendStructure(fetchedData: {
  [categoryName: string]: ConditionIdToNameMap[];
}) {
  const result: CategoryNameToConditionDetailsMap = {};
  Object.entries(fetchedData).forEach(
    ([categoryName, conditionIdToNameMapArray]) => {
      const curCategoryMap: ConditionDetailsMap = {};
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
  fetchedConditions: CategoryNameToConditionDetailsMap,
): CategoryNameToConditionDetailsMap {
  const result: CategoryNameToConditionDetailsMap = {};

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
