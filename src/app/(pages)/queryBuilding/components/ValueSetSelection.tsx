"use client";

import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import { useEffect, useState } from "react";
import classNames from "classnames";
import { Button } from "@trussworks/react-uswds";
import {
  CategoryToConditionArrayMap,
  ConditionsMap,
  NestedQuery,
  MedicalRecordSections,
} from "../utils";
import { ConceptSelectionView } from "./valueSetSelectionViews/ConceptSelectionView";
import SearchField from "@/app/ui/designSystem/searchField/SearchField";
import {
  MEDICAL_RECORD_SECTIONS_ID,
  VALUESET_SELECTION_SEARCH_PLACEHOLDER,
} from "./utils";
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
import { CustomConditionView } from "./valueSetSelectionViews/CustomConditionView";
import { MedicalRecordsView } from "./valueSetSelectionViews/MedicalRecordsView";
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
            activeCondition={activeCondition}
            constructedQuery={constructedQuery}
            categoryToConditionsMap={categoryToConditionsMap}
            conditionsMap={conditionsMap}
            setValueSetSearchFilter={setValueSetSearchFilter}
            setActiveCondition={setActiveCondition}
            handleUpdateCondition={handleUpdateCondition}
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
    </div>
  );
};
