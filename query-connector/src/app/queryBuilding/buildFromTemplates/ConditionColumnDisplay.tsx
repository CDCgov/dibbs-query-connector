import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  CategoryNameToConditionOptionMap,
  filterSearchByCategoryAndCondition,
} from "../utils";
import styles from "./buildfromTemplate.module.scss";
import ConditionOption from "./ConditionOption";
import classNames from "classnames";
import { FormError } from "./BuildFromTemplates";

type ConditionColumnDisplayProps = {
  fetchedConditions: CategoryNameToConditionOptionMap;
  searchFilter: string | undefined;
  selectedConditions: CategoryNameToConditionOptionMap;
  setSelectedConditions: Dispatch<
    SetStateAction<CategoryNameToConditionOptionMap | undefined>
  >;
  setFormError: Dispatch<SetStateAction<FormError>>;
  formError: FormError;
  updateFetched: (selectedConditions: CategoryNameToConditionOptionMap) => void;
};
/**
 * Column display component for the query building page
 * @param root0 - params
 * @param root0.fetchedConditions - conditions queried from backend to display
 * @param root0.searchFilter - filter grabbed from search field to filter fetched
 * components against
 * @param root0.selectedConditions - conditions the user has marked as included in
 * their query
 * @param root0.setSelectedConditions - state function that updates the subset of
 * fetched conditions to be included in the query
 * @param root0.setFormError - state function that updates the subset of
 * fetched conditions to be included in the query
 * @param root0.formError - state function that updates the subset of
 * fetched conditions to be included in the query
 * @param root0.updateFetched - state function that updates the subset of
 * fetched conditions to be included in the query
 * @returns Conditions split out into two columns that will filter themselves
 * at both the category and condition levels if a valid search filter is applied.
 */
export const ConditionColumnDisplay: React.FC<ConditionColumnDisplayProps> = ({
  fetchedConditions,
  searchFilter,
  selectedConditions,
  setSelectedConditions,
  formError,
  setFormError,
  updateFetched,
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

  async function toggleFetchedConditionSelection(
    category: string,
    conditionName: string,
  ) {
    const prevSelected =
      selectedConditions?.[category]?.[conditionName]?.include;
    const prevFetch = structuredClone(fetchedConditions);
    const prevValues = prevFetch[category][conditionName];
    prevFetch[category][conditionName] = {
      name: prevValues.name,
      include: !prevValues.include,
    };

    const shouldRemove =
      // prevSelected being undefined means we've never added anything to selectedConditions,
      // so we shouldn't remove anything
      prevSelected == undefined ? false : true;
    updateSelectedConditions(shouldRemove, category, conditionName, prevFetch);
    updateFetched(selectedConditions);
  }

  const updateSelectedConditions = (
    shouldRemove: boolean,
    category: string,
    conditionName: string,
    prevFetch: CategoryNameToConditionOptionMap,
  ) => {
    if (shouldRemove) {
      delete selectedConditions[category][conditionName];
      // if there are no more entries for a given category, remove the category
      if (Object.values(selectedConditions[category]).length == 0) {
        delete selectedConditions[category];
      }
      // if there are no entries at all, set an error (to disable the button)
      if (Object.values(selectedConditions).length < 1) {
        setFormError({ ...formError, ...{ selectedConditions: true } });
      }
    } else {
      setSelectedConditions((prevState) => {
        return {
          ...prevState,
          [category]: {
            ...prevState?.[category],
            [conditionName]: prevFetch[category]?.[conditionName],
          },
        };
      });
    }
  };

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
                const handleConditionSelection = (conditionName: string) => {
                  toggleFetchedConditionSelection(category, conditionName);
                };
                return (
                  <div key={category}>
                    <h3 className={styles.categoryHeading}>{category}</h3>
                    {Object.entries(arr).map(
                      ([conditionId, conditionOption]) => {
                        return (
                          <ConditionOption
                            checked={
                              selectedConditions[category] &&
                              Object.keys(
                                selectedConditions[category],
                              ).includes(conditionId)
                            }
                            key={conditionOption.name}
                            conditionId={conditionId}
                            conditionName={conditionOption.name}
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
