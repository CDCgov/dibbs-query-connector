import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  CategoryNameToConditionOptionMap,
  filterSearchByCategoryAndCondition,
} from "../utils";
import styles from "./buildfromTemplate.module.scss";
import ConditionOption from "./ConditionOption";
import classNames from "classnames";

type ConditionColumnDisplayProps = {
  fetchedConditions: CategoryNameToConditionOptionMap;
  searchFilter: string | undefined;
  selectedConditions: CategoryNameToConditionOptionMap;
  setFetchedConditions: Dispatch<
    SetStateAction<CategoryNameToConditionOptionMap | undefined>
  >;
  setSelectedConditions: Dispatch<
    SetStateAction<CategoryNameToConditionOptionMap | undefined>
>;
};
/**
 * Column display component for the query building page
 * @param root0 - params
 * @param root0.fetchedConditions - conditions queried from backend to display
 * @param root0.searchFilter - filter grabbed from search field to filter fetched
 * components against
 * @param root0.selectedConditions - conditions queried from backend to display
 * @param root0.setFetchedConditions - state function that updates the include /
 * exclude of the queryset
 * @param root0.setSelectedConditions - state function that updates the include /
 * exclude of the queryset
 * @returns Conditions split out into two columns that will filter themselves
 * at both the category and condition levels if a valid search filter is applied.
 */
export const ConditionColumnDisplay: React.FC<ConditionColumnDisplayProps> = ({
  fetchedConditions,
  searchFilter,
  selectedConditions,
  setFetchedConditions,
  setSelectedConditions,
}) => {
  const [conditionsToDisplay, setConditionsToDisplay] =
    useState(fetchedConditions);

  useEffect(() => {
    if (searchFilter === "") {
      setConditionsToDisplay(fetchedConditions);
    }
    if (searchFilter) {
      const filteredDisplay = filterSearchByCategoryAndCondition(
        searchFilter,
        fetchedConditions,
      );
      setConditionsToDisplay(filteredDisplay);
    }
  }, [searchFilter]);

  function toggleFetchedConditionSelection(
    category: string,
    conditionId: string,
  ) {
    const prevFetch = structuredClone(fetchedConditions);
    const prevValues = prevFetch[category][conditionId];
    prevFetch[category][conditionId] = {
      name: prevValues.name,
      include: !prevValues.include,
    };
    const shouldRemove = prevFetch[category][conditionId].include == false
    updateSelectedConditions(shouldRemove, category, conditionId, prevFetch)
    setFetchedConditions(prevFetch);
  }

  const updateSelectedConditions = (
    shouldRemove:boolean, 
    category:string, 
    conditionId:string, 
    prevFetch:CategoryNameToConditionOptionMap
  ) => {
    if (shouldRemove) {
      delete selectedConditions[category][conditionId]
     // if there are no more entries for a given category, remove the category
      if (Object.values(selectedConditions[category]).length == 0) {
        delete selectedConditions[category]
      }
    } else {setSelectedConditions(prevState => {
      return {   
          ...prevState,
          [category]: {
            ...prevState?.[category],
            [conditionId]: prevFetch[category]?.[conditionId]
          }
        }
    })
  }
}

  const columnOneEntries = Object.entries(conditionsToDisplay).filter(
    (_, i) => i % 2 === 0,
  );
  const columnTwoEntries = Object.entries(conditionsToDisplay).filter(
    (_, i) => i % 2 === 1,
  );

  const colsToDisplay = [
    columnOneEntries,
    columnTwoEntries,
    // alphabetize by category
  ].map((arr) => arr.sort((a, b) => (a[0] > b[0] ? 1 : -1)));

  return (
    <div className="grid-container ">
      <div className="grid-row grid-gap">
        {colsToDisplay.map((colsToDisplay, i) => {
          return (
            <div
              className={classNames(styles.displayCol, "grid-col")}
              key={`col-${i}`}
            >
              {colsToDisplay.map(([category, arr]) => {
                const handleConditionSelection = (conditionId: string) => {
                  toggleFetchedConditionSelection(category, conditionId);
                };
                return (
                  <div key={category}>
                    <h3 className={styles.categoryHeading}>{category}</h3>
                    {Object.entries(arr).map(
                      ([conditionId, conditionNameAndInclude]) => {
                        return (
                          <ConditionOption
                            checked={conditionNameAndInclude.include}
                            key={conditionId}
                            conditionId={conditionId}
                            conditionName={conditionNameAndInclude.name}
                            handleConditionSelection={handleConditionSelection}
                          />
                        );
                      },
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConditionColumnDisplay;
