"use client";

import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import { useEffect, useState } from "react";
import classNames from "classnames";
import { Button, Icon } from "@trussworks/react-uswds";
import {
  CategoryToConditionArrayMap,
  ConditionsMap,
  filterSearchByCategoryAndCondition,
  formatDiseaseDisplay,
  formatCategoryDisplay,
  NestedQuery,
} from "../utils";
import { ConceptTypeSelectionTable } from "./SelectionTable";
import Drawer from "@/app/ui/designSystem/drawer/Drawer";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import SearchField from "@/app/ui/designSystem/searchField/SearchField";
import {
  CONDITION_DRAWER_SEARCH_PLACEHOLDER,
  VALUESET_SELECTION_SEARCH_PLACEHOLDER,
} from "./utils";
import Highlighter from "react-highlight-words";
import {
  DibbsConceptType,
  DibbsValueSet,
} from "@/app/models/entities/valuesets";

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
  const [conditionDrawerData, setConditionDrawerData] =
    useState<CategoryToConditionArrayMap>(categoryToConditionsMap);
  const [conditionSearchFilter, setConditionSearchFilter] = useState("");
  const [valueSetSearchFilter, setValueSetSearchFilter] = useState("");

  useEffect(() => {
    // display the first condition's valuesets on render
    setActiveCondition(Object.keys(constructedQuery)[0] || "custom");
  }, [constructedQuery]);

  function generateConditionDrawerDisplay(
    categoryToConditionsMap: CategoryToConditionArrayMap,
  ) {
    return Object.entries(categoryToConditionsMap).map(
      ([category, conditions]) => (
        <div id={category} key={category}>
          <div className={styles.conditionDrawerHeader}>
            <Highlighter
              highlightClassName="searchHighlight"
              searchWords={[conditionSearchFilter]}
              autoEscape={true}
              textToHighlight={formatCategoryDisplay(category)}
            ></Highlighter>
          </div>
          <div>
            {Object.values(conditions).map((condition) => (
              <div
                key={`update-${condition.id}`}
                id={`update-${condition.id}`}
                data-testid={`update-${condition.id}`}
                className={styles.conditionItem}
              >
                <span>
                  {" "}
                  <Highlighter
                    highlightClassName="searchHighlight"
                    searchWords={[conditionSearchFilter]}
                    autoEscape={true}
                    textToHighlight={formatDiseaseDisplay(condition.name)}
                  ></Highlighter>
                </span>

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
    setConditionSearchFilter(searchFilter);
    setConditionDrawerData(filteredDisplay);
  }

  function handleConditionToggle(conditionId: string) {
    setActiveCondition(conditionId);
    setValueSetSearchFilter("");
  }

  const activeConditionValueSets = constructedQuery[activeCondition];

  return (
    <div
      className={classNames(
        "background-dark margin-top-4 ",
        styles.valueSetTemplateContainer,
      )}
    >
      <div className={styles.valueSetTemplateContainer__inner}>
        <div className={styles.valueSetTemplate__left}>
          <div className={styles.sideBarMenu}>
            <div className={styles.sideBarMenu__content}>
              <div className={styles.section_templates}>
                <div className={styles.sectionTitle}>
                  <div>{"Templates".toLocaleUpperCase()}</div>
                  <div
                    className={styles.addCondition}
                    role="button"
                    data-testid={"add-condition-icon"}
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
                          ? `${conditionId}-card-active`
                          : `${conditionId}-card`
                      }
                      className={classNames(
                        "align-items-center",
                        activeCondition == conditionId
                          ? `${styles.card} ${styles.active}`
                          : styles.card,
                      )}
                    >
                      <div
                        key={`tab-${conditionId}`}
                        id={`tab-${conditionId}`}
                        onClick={() => handleConditionToggle(conditionId)}
                        tabIndex={0}
                      >
                        {formatDiseaseDisplay(condition.name)}
                      </div>
                      <Icon.Delete
                        className={classNames("usa-icon", styles.deleteIcon)}
                        size={5}
                        color="red"
                        data-testid={`delete-condition-${conditionId}`}
                        aria-label="Trash icon indicating deletion of disease"
                        onClick={() => {
                          handleUpdateCondition(conditionId, true);
                          handleConditionToggle(
                            Object.keys(constructedQuery)[0],
                          );
                        }}
                      ></Icon.Delete>
                    </div>
                  );
                })}
              </div>
              <div className={styles.section_custom}>
                <div className={classNames(styles.sectionTitle)}>
                  {"Custom".toLocaleUpperCase()}
                </div>
                <div
                  className={classNames(
                    "align-items-center",
                    activeCondition == "custom"
                      ? `${styles.card} ${styles.active}`
                      : styles.card,
                  )}
                >
                  <div
                    id={`tab-custom`}
                    onClick={() => setActiveCondition("custom")}
                    tabIndex={0}
                    role="button"
                  >
                    Additional codes from library
                  </div>
                </div>{" "}
              </div>
            </div>
          </div>
        </div>
        <div className={styles.valueSetTemplate__right}>
          {activeCondition !== "custom" && (
            <div className={styles.valueSetTemplate__search}>
              <SearchField
                id="valueSetTemplateSearch"
                placeholder={VALUESET_SELECTION_SEARCH_PLACEHOLDER}
                className={styles.valueSetSearch}
                onChange={(e) => {
                  e.preventDefault();
                  setValueSetSearchFilter(e.target.value);
                }}
                value={valueSetSearchFilter}
              />
            </div>
          )}

          {activeConditionValueSets && activeCondition !== "custom" && (
            <ConceptTypeSelectionTable
              vsTypeLevelOptions={activeConditionValueSets}
              handleVsTypeLevelUpdate={handleSelectedValueSetUpdate(
                activeCondition,
              )}
              searchFilter={valueSetSearchFilter}
              setSearchFilter={setValueSetSearchFilter}
            />
          )}
          {activeCondition == "custom" && (
            <div className={styles.codeLibrary__empty}>
              <Icon.GridView
                aria-label="Stylized icon showing four squares in a grid"
                className={classNames("usa-icon", styles.icon)}
                color="#919191"
              />
              <p className={styles.codeLibrary__emptyText}>
                <strong>
                  This is a space for you to pull in individual value sets
                </strong>
              </p>
              <p className={styles.codeLibrary__emptyText}>
                <strong>
                  These can be official value sets from CSTE, or ones that you
                  have created in the code library.
                </strong>
              </p>
              <Button className={styles.codeLibrary__button} type="button">
                Add from code library
              </Button>
            </div>
          )}
        </div>
      </div>

      <Drawer
        title="Add Condition(s)"
        placeholder={CONDITION_DRAWER_SEARCH_PLACEHOLDER}
        toRender={
          <>
            {Object.keys(conditionDrawerData).length > 0 ? (
              generateConditionDrawerDisplay(conditionDrawerData)
            ) : (
              <div>
                <div className="padding-top-4"> No conditions found</div>
              </div>
            )}{" "}
          </>
        }
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
