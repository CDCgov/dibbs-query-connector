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
  MedicalRecordSections,
  EMPTY_MEDICAL_RECORD_SECTIONS,
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
import Checkbox from "@/app/ui/designSystem/checkbox/Checkbox";

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
  medicalRecordSections: MedicalRecordSections;
  setMedicalRecordSections: React.Dispatch<
    React.SetStateAction<MedicalRecordSections>
  >;
};

/**
 * Display component for a condition on the query building page
 * @param root0 - params
 * @param root0.constructedQuery - current state of the built query
 * @param root0.handleSelectedValueSetUpdate - handler function for ValueSet level updates
 * @param root0.handleUpdateCondition - handler function for condition update
 * @param root0.conditionsMap - condition details
 * @param root0.categoryToConditionsMap - category-index condition details
 * @param root0.medicalRecordSections - sections of the medical record to include in the query
 * @param root0.setMedicalRecordSections - function to update the medical record sections
 * @returns A component for display to render on the query building page
 */
export const ValueSetSelection: React.FC<ConditionSelectionProps> = ({
  constructedQuery,
  handleSelectedValueSetUpdate,
  handleUpdateCondition,
  conditionsMap,
  categoryToConditionsMap,
  medicalRecordSections,
  setMedicalRecordSections,
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

  const MEDICAL_RECORD_SECTIONS_ID = "MEDICAL_RECORD_SECTIONS";

  useEffect(() => {
    // display the first condition's valuesets on render
    if (!constructedQuery || Object.keys(constructedQuery).length === 0) return;
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
    } else {
      setActiveCondition(MEDICAL_RECORD_SECTIONS_ID);
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
  const isMedicalRecordsTab = activeCondition === MEDICAL_RECORD_SECTIONS_ID;

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
                  <button
                    className={styles.addCondition}
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
                  </button>
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
                        <Button
                          unstyled
                          type={"button"}
                          key={`tab-${conditionId}`}
                          id={`tab-${conditionId}`}
                          onClick={() => handleConditionToggle(conditionId)}
                        >
                          {formatDiseaseDisplay(condition.name)}
                        </Button>
                        <Button
                          type={"button"}
                          unstyled
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
                          className={styles.deleteIcon}
                          data-testid={`delete-condition-${conditionId}`}
                        >
                          <Icon.Delete
                            className={classNames(
                              // "usa-icon",
                              "destructive-primary",
                            )}
                            size={5}
                            aria-label="Trash icon indicating deletion of disease"
                          ></Icon.Delete>
                        </Button>
                      </div>
                    );
                  })}
              </div>
              <div className={styles.section_custom}>
                <div
                  className={classNames(styles.sectionTitle, "padding-top-2")}
                >
                  {CUSTOM_VALUESET_ARRAY_ID.toLocaleUpperCase()}
                </div>
                <div
                  className={classNames(
                    "align-items-center",
                    isCustomConditionTab
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
                </div>
              </div>
              <div className={styles.section_custom}>
                <div
                  className={classNames(
                    "align-items-center",
                    isMedicalRecordsTab
                      ? `${styles.card} ${styles.active}`
                      : styles.card,
                  )}
                >
                  <div
                    id={`tab-medical-records`}
                    onClick={() =>
                      setActiveCondition(MEDICAL_RECORD_SECTIONS_ID)
                    }
                    tabIndex={0}
                    role="button"
                  >
                    Medical record sections
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.valueSetTemplate__right}>
          {isMedicalRecordsTab ? (
            <div className={styles.medicalRecordSectionControls}>
              <div
                className={(styles.medicalRecordSectionControls, "padding-4")}
              >
                {Object.keys(EMPTY_MEDICAL_RECORD_SECTIONS).map((key) => (
                  <div key={key} className={styles.medicalRecordSectionRow}>
                    <div
                      data-testid={`container-medical-record-section-checkbox-${key}`}
                    >
                      <Checkbox
                        id={`medical-record-section-checkbox-${key}`}
                        label={`Include ${key
                          .replace(/([A-Z])/g, " $1")
                          .toLowerCase()}`}
                        checked={
                          !!(
                            medicalRecordSections &&
                            medicalRecordSections[
                              key as keyof MedicalRecordSections
                            ]
                          )
                        }
                        aria-label={`Select medical recored section ${key}`}
                        onChange={(e) =>
                          setMedicalRecordSections((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
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
                    secondary
                    onClick={() =>
                      saveQueryAndRedirect(
                        constructedQuery,
                        medicalRecordSections,
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
                      These can be official value sets from CSTE, or ones that
                      you have created in the code library.
                    </strong>
                  </p>
                  <Button
                    className={styles.codeLibrary__button}
                    type="button"
                    onClick={() =>
                      saveQueryAndRedirect(
                        constructedQuery,
                        medicalRecordSections,
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
            </>
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
