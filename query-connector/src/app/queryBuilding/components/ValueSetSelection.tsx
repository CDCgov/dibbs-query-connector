"use client";

import styles from "../conditionTemplateSelection/conditionTemplateSelection.module.scss";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import classNames from "classnames";

import {
  CategoryNameToConditionOptionMap,
  ConditionIdToValueSetArrayMap,
  ConditionOption,
  groupConditionDataByCategoryName,
} from "../utils";
import SearchField from "@/app/query/designSystem/searchField/SearchField";
import { Icon } from "@trussworks/react-uswds";

import {
  formatDiseaseDisplay,
  NestedQuery,
  updateConditionStatus,
} from "../utils";
import { ConceptTypeSelectionTable } from "./ConceptTypeSelectionTable";

import Drawer from "@/app/query/designSystem/drawer/Drawer";
import {
  groupValueSetGroupingByConditionId,
  VsGrouping,
} from "@/app/utils/valueSetTranslation";
import { getConditionsData } from "@/app/database-service";
import { DibbsConceptType, DibbsValueSet } from "@/app/constants";
import { showToastConfirmation } from "@/app/query/designSystem/toast/Toast";

type ConditionSelectionProps = {
  selectedConditions: CategoryNameToConditionOptionMap;
  valueSetsByCondition: ConditionIdToValueSetArrayMap;
  constructedQuery: NestedQuery;
  handleAddCondition: (conditionId: string) => void;
  fetchedConditions: CategoryNameToConditionOptionMap | undefined;
  handleSelectedValueSetUpdate: (
    conditionId: string,
  ) => (
    vsType: DibbsConceptType,
  ) => (
    vsName: string,
  ) => (vsGrouping: VsGrouping) => (dibbsValueSets: DibbsValueSet[]) => void;
};

/**
 * Display component for a condition on the query building page
 * @param root0 - params
 * @param root0.queryName - current checkbox selection status
 * @param root0.selectedConditions - name of condition to display
 * @param root0.valueSetsByCondition - {conditionId: ValueSet[]} map
 * @param root0.setSelectedConditions - stuff
 * @returns A component for display to render on the query building page
 */
export const ValueSetSelection: React.FC<ConditionSelectionProps> = ({
  selectedConditions,
  valueSetsByCondition,
  handleSelectedValueSetUpdate,
  constructedQuery,
  handleAddCondition,
  fetchedConditions,
}) => {
  const focusRef = useRef<HTMLInputElement | null>(null);
  const [activeCondition, setActiveCondition] = useState<string>("");
  const [_searchFilter, setSearchFilter] = useState<string>();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleDrawer = (open: boolean) => {
    setIsDrawerOpen(open);
  };

  const conditionUpdate = fetchedConditions
    ? Object.entries(fetchedConditions).map(([category, conditions]) => (
        <div key={category}>
          <div className={styles.conditionDrawerHeader}>{category}</div>
          <div>
            {Object.entries(conditions).map(([id, condition]) => (
              <div key={id} className={styles.conditionItem}>
                <span>{formatDiseaseDisplay(condition.name)}</span>
                <span
                  className={styles.addButton}
                  role="button"
                  onClick={() => handleAddCondition(id)}
                >
                  ADD
                </span>
              </div>
            ))}
          </div>
        </div>
      ))
    : undefined;

  // Prepare selected conditions for display in the left pane
  const includedConditionsWithIds = Object.entries(selectedConditions)
    .map(([_, conditionsByCategory]) =>
      Object.entries(conditionsByCategory).flatMap(
        ([conditionId, conditionObj]) => {
          return { id: conditionId, name: conditionObj.name };
        },
      ),
    )
    .flat();

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
                onClick={() => handleDrawer(true)}
                tabIndex={0}
              >
                <Icon.Add
                  aria-label="Plus sign icon indicating addition"
                  className="usa-icon"
                  size={3}
                  color="#005EA2"
                />
                <span>ADD</span>
              </div>
            </div>

            {Object.values(includedConditionsWithIds).map((condition) => {
              return (
                <div
                  key={condition.id}
                  className={
                    activeCondition == condition.id
                      ? `${styles.conditionCard} ${styles.active}`
                      : styles.conditionCard
                  }
                  onClick={() => setActiveCondition(condition.id)}
                  tabIndex={0}
                >
                  {formatDiseaseDisplay(condition.name)}
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
                setSearchFilter(e.target.value);
              }}
            />
          </div>
          <div>
            {constructedQuery && activeCondition && (
              <ConceptTypeSelectionTable
                vsTypeLevelOptions={constructedQuery[activeCondition]}
                handleVsTypeLevelUpdate={handleSelectedValueSetUpdate(
                  activeCondition,
                )}
              />
            )}
          </div>
        </div>
      </div>

      <Drawer
        title="Add Condition(s)"
        placeholder="Search conditions"
        toRender={<div>{conditionUpdate}</div>}
        toastMessage="Condition has been successfully added."
        isOpen={isDrawerOpen}
        onClose={() => handleDrawer(false)}
        onSave={() => {}} //TODO: Add save handler logic
        hasChanges={false}
      />
    </div>
  );
};
