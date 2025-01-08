"use client";

import styles from "../conditionTemplateSelection/conditionTemplateSelection.module.scss";
import { useEffect, useRef, useState } from "react";
import classNames from "classnames";

import SearchField from "@/app/query/designSystem/searchField/SearchField";
import { Icon } from "@trussworks/react-uswds";

import {
  CategoryToConditionArrayMap,
  ConditionsMap,
  formatDiseaseDisplay,
  NestedQuery,
} from "../utils";
import { ConceptTypeSelectionTable } from "./ConceptTypeSelectionTable";

import Drawer from "@/app/query/designSystem/drawer/Drawer";
import { DibbsConceptType, DibbsValueSet } from "@/app/constants";

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
 * @param root0.queryName - current checkbox selection status
 * @param root0.selectedConditions - name of condition to display
 * @param root0.valueSetsByCondition - {conditionId: ValueSet[]} map
 * @param root0.setSelectedConditions - stuff
 * @returns A component for display to render on the query building page
 */
export const ValueSetSelection: React.FC<ConditionSelectionProps> = ({
  constructedQuery,
  handleSelectedValueSetUpdate,
  handleUpdateCondition,
  conditionsMap: conditionsDetailsMap,
  categoryToConditionsMap,
}) => {
  // display the first condition's valuesets on render
  const [activeCondition, setActiveCondition] = useState<string>(
    Object.keys(constructedQuery)[0],
  );
  const [_searchFilter, setSearchFilter] = useState<string>();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleDrawer = (open: boolean) => {
    setIsDrawerOpen(open);
  };

  const conditionUpdate = categoryToConditionsMap
    ? Object.entries(categoryToConditionsMap).map(([category, conditions]) => (
        <div key={category}>
          <div className={styles.conditionDrawerHeader}>{category}</div>
          <div>
            {Object.entries(conditions).map(([id, condition]) => (
              <div key={id} className={styles.conditionItem}>
                <span>{formatDiseaseDisplay(condition.name)}</span>
                <span
                  className={styles.addButton}
                  role="button"
                  onClick={() => handleUpdateCondition(id, false)}
                >
                  ADD
                </span>
              </div>
            ))}
          </div>
        </div>
      ))
    : undefined;

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

            {Object.keys(constructedQuery).map((conditionId) => {
              const condition = conditionsDetailsMap[conditionId];
              return (
                <div
                  key={conditionId}
                  className={
                    activeCondition == conditionId
                      ? `${styles.conditionCard} ${styles.active}`
                      : styles.conditionCard
                  }
                  onClick={() => setActiveCondition(conditionId)}
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
