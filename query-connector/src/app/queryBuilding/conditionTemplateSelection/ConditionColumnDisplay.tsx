import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  CategoryToConditionArrayMap,
  NestedQuery,
  filterSearchByCategoryAndCondition,
} from "../utils";
import styles from "./conditionTemplateSelection.module.scss";
import ConditionOption from "./ConditionOption";
import classNames from "classnames";
import { FormError } from "./ConditionTemplateSelection";

type ConditionColumnDisplayProps = {
  categoryToConditionsMap: CategoryToConditionArrayMap;
  searchFilter: string | undefined;
  constructedQuery: NestedQuery;
  handleConditionUpdate: (conditionId: string, checked: boolean) => void;
  setFormError: Dispatch<SetStateAction<FormError>>;
  formError: FormError;
};
/**
 * Column display component for the query building page
 * @param root0 - params
 * @param root0.fetchedConditions - conditions queried from backend to display
 * @param root0.searchFilter - filter grabbed from search field to filter fetched
 * components against
 * @param root0.selectedConditions - conditions the user has marked as included in
 * their query
 * @param root0.handleAddCondition - state function that updates the subset of
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
  categoryToConditionsMap,
  searchFilter,
  constructedQuery,
  handleConditionUpdate,
  formError,
  setFormError,
}) => {
  const [conditionsToDisplay, setConditionsToDisplay] = useState(
    categoryToConditionsMap,
  );

  useEffect(() => {
    if (searchFilter === "") {
      setConditionsToDisplay(categoryToConditionsMap);
    }
    if (searchFilter) {
      const filteredDisplay = filterSearchByCategoryAndCondition(
        searchFilter,
        categoryToConditionsMap,
      );
      setConditionsToDisplay(filteredDisplay);
    }
  }, [searchFilter]);

  function updateConditionSelection(conditionId: string, remove: boolean) {
    const selectedConditions = Object.keys(constructedQuery);
    // if there are no entries at all, set an error (to disable the button)
    if (selectedConditions.length === 1 && remove) {
      setFormError({ ...formError, ...{ selectedConditions: true } });
    }
    handleConditionUpdate(conditionId, remove);
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
                return (
                  <div key={category}>
                    <h3 className={styles.categoryHeading}>{category}</h3>
                    {arr.map((c) => {
                      return (
                        <ConditionOption
                          checked={Object.keys(constructedQuery).includes(c.id)}
                          key={c.name}
                          conditionId={c.id}
                          conditionName={c.name}
                          handleConditionSelection={updateConditionSelection}
                        />
                      );
                    })}
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
