"use client";

import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import { useEffect, useState } from "react";
import classNames from "classnames";
import { Button } from "@trussworks/react-uswds";
import {
  CategoryToConditionArrayMap,
  ConditionsMap,
  filterSearchByCategoryAndCondition,
  formatDiseaseDisplay,
  formatCategoryDisplay,
  NestedQuery,
  formatCategoryToConditionsMap,
  MedicalRecordSections,
} from "../utils";
import { ConceptSelectionView } from "./valueSetSelectionViews/ConceptSelection";
import Drawer from "@/app/ui/designSystem/drawer/Drawer";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import SearchField from "@/app/ui/designSystem/searchField/SearchField";
import {
  CONDITION_DRAWER_SEARCH_PLACEHOLDER,
  MEDICAL_RECORD_SECTIONS_ID,
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
import { CustomConditionView } from "./valueSetSelectionViews/CustomCondition";
import { MedicalRecordsView } from "./valueSetSelectionViews/MedicalRecordsSection";
import { Sidebar } from "./valueSetSelectionViews/Sidebar";

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
                className={classNames(styles.conditionItem)}
                tabIndex={0}
              >
                <span>
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
                  <button
                    className={classNames(
                      styles.addButton,
                      "unstyled-button-container",
                    )}
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
                  </button>
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
          <Sidebar
            constructedQuery={constructedQuery}
            setIsDrawerOpen={setIsDrawerOpen}
            conditionsMap={conditionsMap}
            activeCondition={activeCondition}
            setActiveCondition={setActiveCondition}
            isCustomConditionTab={isCustomConditionTab}
            handleConditionToggle={handleConditionToggle}
            handleUpdateCondition={handleUpdateCondition}
            isMedicalRecordsTab={isMedicalRecordsTab}
          />
        </div>
        <div className={styles.valueSetTemplate__right}>
          {isMedicalRecordsTab ? (
            <MedicalRecordsView
              medicalRecordSections={medicalRecordSections}
              setMedicalRecordSections={setMedicalRecordSections}
            />
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

              <ConceptSelectionView
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
                <CustomConditionView
                  constructedQuery={constructedQuery}
                  medicalRecordSections={medicalRecordSections}
                  queryName={queryName}
                />
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
