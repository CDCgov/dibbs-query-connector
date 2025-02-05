"use client";

import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import { useEffect, useState } from "react";
import classNames from "classnames";
import { Icon } from "@trussworks/react-uswds";
import {
  CategoryToConditionArrayMap,
  ConditionsMap,
  filterSearchByCategoryAndCondition,
  formatDiseaseDisplay,
  NestedQuery,
} from "../utils";
import { ConceptTypeSelectionTable } from "./SelectionTable";
import Drawer from "@/app/ui/designSystem/drawer/Drawer";
import { DibbsConceptType, DibbsValueSet } from "@/app/shared/constants";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import SearchField from "@/app/ui/designSystem/searchField/SearchField";
import { CONDITION_DRAWER_SEARCH_PLACEHOLDER } from "./utils";

type ConditionSelectionProps = {
  constructedQuery: NestedQuery;
  handleUpdateCondition: (conditionId: string, remove: boolean) => void;
  conditionsMap: ConditionsMap;
  categoryToConditionsMap: CategoryToConditionArrayMap;
  handleSelectedValueSetUpdate: (
    conditionId: string,
  ) => (
    vsType: DibbsConceptType,
  ) => (vsId: string) => (dibbsValueSets: DibbsValueSet) => void;
};

/**
 * Display component for a condition on the query building page
 * @param root0 - params
 * @param root0.constructedQuery - current state of the built query
 * @param root0.handleSelectedValueSetUpdate - handler function for ValueSet level updates
 * @param root0.handleUpdateCondition - handler function for condition update
 * @param root0.conditionsMap - condition details
 * @param root0.categoryToConditionsMap - category-index condition details
 * @returns A component for display to render on the query building page
 */
export const ValueSetSelection: React.FC<ConditionSelectionProps> = ({
  constructedQuery,
  handleSelectedValueSetUpdate,
  handleUpdateCondition,
  conditionsMap,
  categoryToConditionsMap,
}) => {
  const [activeCondition, setActiveCondition] = useState<string>("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchFilter, _setSearchFilter] = useState("");
  const [conditionDrawerDisplay, setConditionDrawerDisplay] =
    useState<CategoryToConditionArrayMap>(categoryToConditionsMap);

  useEffect(() => {
    // display the first condition's valuesets on render
    setActiveCondition(Object.keys(constructedQuery)[0]);
  }, []);

  function generateConditionDrawerDisplay(
    categoryToConditionsMap: CategoryToConditionArrayMap,
  ) {
    return Object.entries(categoryToConditionsMap).map(
      ([category, conditions]) => (
        <div id={category} key={category}>
          <div className={styles.conditionDrawerHeader}>{category}</div>
          <div>
            {Object.values(conditions).map((condition) => (
              <div
                key={`update-${condition.id}`}
                id={`update-${condition.id}`}
                className={styles.conditionItem}
              >
                <span>{formatDiseaseDisplay(condition.name)}</span>

                {Object.keys(constructedQuery).includes(condition.id) ? (
                  <span
                    className={styles.addedStatus}
                    data-testid={`condition-drawer-added-${condition.id}`}
                  >
                    Added
                  </span>
                ) : (
                  <span
                    className={styles.addButton}
                    role="button"
                    data-testid={`condition-drawer-add-${condition.id}`}
                    onClick={() => {
                      handleUpdateCondition(condition.id, false);
                      showToastConfirmation({
                        body: `${condition.name} added to query`,
                      });
                    }}
                  >
                    ADD
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ),
    );
  }

  function handleConditionSearch(searchFilter: string) {
    const filteredDisplay = filterSearchByCategoryAndCondition(
      searchFilter,
      categoryToConditionsMap,
    );
    setConditionDrawerDisplay(filteredDisplay);
  }

  function handleSearch(searchFilter: string) {
    // TODO: in an upcoming PR
    console.log(searchFilter);
  }

  const conditionUpdate =
    Object.keys(conditionDrawerDisplay).length > 0 ? (
      generateConditionDrawerDisplay(conditionDrawerDisplay)
    ) : (
      <div>
        <div className="padding-top-4"> No conditions found</div>
      </div>
    );

  return (
    <div
      className={classNames(
        "bg-gray-5 margin-top-4 ",
        styles.valueSetTemplateContainer,
      )}
    >
      <div className={styles.valueSetTemplateContainer__inner}>
        <div className={styles.valueSetTemplate__left}>
          <div className={styles.conditionList}>
            <div className={styles.controls}>
              <div className={styles.conditionsTitle}>
                {"Conditions".toLocaleUpperCase()}
              </div>
              <div
                className={styles.addCondition}
                role="button"
                onClick={() => setIsDrawerOpen(true)}
                tabIndex={0}
              >
                <Icon.Add
                  aria-label="Plus sign icon indicating addition"
                  className="usa-icon"
                  size={3}
                  color="#005EA2"
                />
                <span data-testid="add-left-rail">ADD</span>
              </div>
            </div>

            {Object.keys(constructedQuery).map((conditionId) => {
              const condition = conditionsMap[conditionId];
              return (
                <div
                  key={conditionId}
                  data-testid={
                    activeCondition == conditionId
                      ? `${conditionId}-conditionCard-active`
                      : `${conditionId}-conditionCard`
                  }
                  className={classNames(
                    "align-items-center",
                    activeCondition == conditionId
                      ? `${styles.conditionCard} ${styles.active}`
                      : styles.conditionCard,
                  )}
                >
                  <div
                    key={`tab-${conditionId}`}
                    id={`tab-${conditionId}`}
                    onClick={() => setActiveCondition(conditionId)}
                    tabIndex={0}
                  >
                    {formatDiseaseDisplay(condition.name)}
                  </div>
                  <Icon.Delete
                    className={classNames("usa-icon", styles.deleteIcon)}
                    size={5}
                    color="red"
                    aria-label="Trash icon indicating deletion of disease"
                    onClick={() => {
                      handleUpdateCondition(conditionId, true);
                      setActiveCondition(Object.keys(constructedQuery)[0]);
                    }}
                  ></Icon.Delete>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.valueSetTemplate__right}>
          <div className={styles.valueSetTemplate__search}>
            <SearchField
              id="valueSetTemplateSearch"
              placeholder="Search labs, medications, conditions"
              className={styles.valueSetSearch}
              onChange={(e) => {
                e.preventDefault();
                handleSearch(e.target.value);
              }}
            />
          </div>
          <div>
            {constructedQuery && constructedQuery[activeCondition] && (
              <ConceptTypeSelectionTable
                vsTypeLevelOptions={constructedQuery[activeCondition]}
                handleVsTypeLevelUpdate={handleSelectedValueSetUpdate(
                  activeCondition,
                )}
                searchFilter={searchFilter}
              />
            )}
          </div>
        </div>
      </div>

      <Drawer
        title="Add Condition(s)"
        placeholder={CONDITION_DRAWER_SEARCH_PLACEHOLDER}
        toRender={conditionUpdate}
        toastMessage="Condition has been successfully added."
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={() => {
          handleUpdateCondition;
        }}
        onSearch={handleConditionSearch}
      />
    </div>
  );
};
