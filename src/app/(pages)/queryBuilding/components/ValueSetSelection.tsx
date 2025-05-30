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
  formatCategoryToConditionsMap,
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
import {
  generateValueSetGroupingsByDibbsConceptType,
  ConceptTypeToDibbsVsMap,
} from "@/app/utils/valueSetTranslation";
import { CUSTOM_VALUESET_ARRAY_ID } from "@/app/shared/constants";
import { useSaveQueryAndRedirect } from "../../../backend/query-building/useSaveQueryAndRedirect";
import { useContext } from "react";
import { DataContext } from "@/app/shared/DataProvider";

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
    useState<CategoryToConditionArrayMap>(
      formatCategoryToConditionsMap(categoryToConditionsMap),
    );
  const [conditionSearchFilter, setConditionSearchFilter] = useState("");
  const [valueSetSearchFilter, setValueSetSearchFilter] = useState("");

  const queryContext = useContext(DataContext);
  const queryName = queryContext?.selectedQuery?.queryName;

  useEffect(() => {
    // display the first condition's valuesets on render
    if (activeCondition) return;

    const queryKeys = Object.keys(constructedQuery);
    const nonCustom = queryKeys.filter(
      (key) => key !== CUSTOM_VALUESET_ARRAY_ID,
    );

    const firstValid = nonCustom.find(
      (key) => constructedQuery[key] !== undefined,
    );

    if (firstValid) {
      setActiveCondition(firstValid);
    } else if (queryKeys.includes(CUSTOM_VALUESET_ARRAY_ID)) {
      setActiveCondition(CUSTOM_VALUESET_ARRAY_ID);
    }
  }, [constructedQuery, activeCondition]);

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
                      setActiveCondition(condition.id);
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
      formatCategoryToConditionsMap(categoryToConditionsMap),
    );
    setConditionSearchFilter(searchFilter);
    setConditionDrawerData(filteredDisplay);
  }

  function handleConditionToggle(conditionId: string) {
    setActiveCondition(conditionId);
    setValueSetSearchFilter("");
  }

  // Check if the active condition is CUSTOM_VALUESET_ARRAY_ID
  const isCustomConditionTab = activeCondition === CUSTOM_VALUESET_ARRAY_ID;

  // Get the value sets for the active condition, additional logic for custom condition
  const activeConditionValueSets: ConceptTypeToDibbsVsMap | undefined =
    isCustomConditionTab
      ? constructedQuery[CUSTOM_VALUESET_ARRAY_ID]
        ? generateValueSetGroupingsByDibbsConceptType(
            Object.values(constructedQuery[CUSTOM_VALUESET_ARRAY_ID]).flatMap(
              (vsMap) => Object.values(vsMap),
            ),
          )
        : { labs: {}, conditions: {}, medications: {} }
      : constructedQuery[activeCondition];

  // Check if there are any custom value sets
  const hasCustomValueSets = Object.values(activeConditionValueSets ?? {}).some(
    (vsMap) => Object.keys(vsMap).length > 0,
  );

  // add button for customLibrary redirect
  const saveQueryAndRedirect = useSaveQueryAndRedirect();

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
                    />
                    <span data-testid="add-left-rail">ADD</span>
                  </div>
                </div>

                {Object.keys(constructedQuery)
                  .filter(
                    (conditionId) => conditionId !== CUSTOM_VALUESET_ARRAY_ID,
                  )
                  .map((conditionId) => {
                    const condition = conditionsMap[conditionId];
                    if (!condition) return null;
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
                          className={classNames(
                            "usa-icon",
                            styles.deleteIcon,
                            "destructive-primary",
                          )}
                          size={5}
                          data-testid={`delete-condition-${conditionId}`}
                          aria-label="Trash icon indicating deletion of disease"
                          onClick={() => {
                            handleUpdateCondition(conditionId, true);
                            const next = Object.keys(constructedQuery).find(
                              (k) =>
                                k !== conditionId &&
                                k !== CUSTOM_VALUESET_ARRAY_ID,
                            );
                            handleConditionToggle(
                              next ?? CUSTOM_VALUESET_ARRAY_ID,
                            );
                          }}
                        ></Icon.Delete>
                      </div>
                    );
                  })}
              </div>
              <div className={styles.section_custom}>
                <div className={classNames(styles.sectionTitle)}>
                  {CUSTOM_VALUESET_ARRAY_ID.toLocaleUpperCase()}
                </div>
                <div
                  className={classNames(
                    "align-items-center",
                    activeCondition == CUSTOM_VALUESET_ARRAY_ID
                      ? `${styles.card} ${styles.active}`
                      : styles.card,
                  )}
                >
                  <div
                    id={`tab-custom`}
                    onClick={() => setActiveCondition(CUSTOM_VALUESET_ARRAY_ID)}
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
          {(activeConditionValueSets !== undefined || isCustomConditionTab) && (
            <>
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
                {isCustomConditionTab && hasCustomValueSets && (
                  <Button
                    type="button"
                    outline
                    onClick={() =>
                      saveQueryAndRedirect(
                        constructedQuery,
                        queryName,
                        "/codeLibrary",
                        "select",
                      )
                    }
                  >
                    Add from code library
                  </Button>
                )}
              </div>

              <ConceptTypeSelectionTable
                vsTypeLevelOptions={
                  activeConditionValueSets ?? {
                    labs: {},
                    conditions: {},
                    medications: {},
                  }
                }
                handleVsTypeLevelUpdate={handleSelectedValueSetUpdate(
                  activeCondition,
                )}
                searchFilter={valueSetSearchFilter}
                setSearchFilter={setValueSetSearchFilter}
              />
            </>
          )}
          {isCustomConditionTab && !hasCustomValueSets && (
            <div className={styles.codeLibrary__empty}>
              <Icon.GridView
                aria-label="Stylized icon showing four squares in a grid"
                className={classNames("usa-icon", styles.icon)}
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
              <Button
                className={styles.codeLibrary__button}
                type="button"
                onClick={() =>
                  saveQueryAndRedirect(
                    constructedQuery,
                    queryName,
                    "/codeLibrary",
                    "select",
                  )
                }
              >
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
