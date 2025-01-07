"use client";

import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { useEffect, useRef, useState } from "react";
import classNames from "classnames";

import {
  CategoryNameToConditionOptionMap,
  ConditionIdToValueSetArrayMap,
  groupConditionDataByCategoryName,
} from "../utils";
import SearchField from "@/app/query/designSystem/searchField/SearchField";
import { Icon } from "@trussworks/react-uswds";

import { formatDiseaseDisplay } from "../utils";
import { SelectionTable } from "./SelectionTable";

import Drawer from "@/app/query/designSystem/drawer/Drawer";
import {
  groupValueSetGroupingByConditionId,
  VsGrouping,
} from "@/app/utils/valueSetTranslation";
import { getConditionsData } from "@/app/database-service";
import { DibbsConceptType, DibbsValueSet } from "@/app/constants";
import { ConditionToConceptTypeToValueSetGroupingMap } from "@/app/queryBuilding/utils";
import { showToastConfirmation } from "@/app/query/designSystem/toast/Toast";

type ConditionSelectionProps = {
  queryName: string;
  selectedConditions: CategoryNameToConditionOptionMap;
  valueSetsByCondition: ConditionIdToValueSetArrayMap;
};

/**
 * Display component for a condition on the query building page
 * @param root0 - params
 * @param root0.queryName - current checkbox selection status
 * @param root0.selectedConditions - name of condition to display
 * @param root0.valueSetsByCondition - {conditionId: ValueSet[]} map
 * @returns A component for display to render on the query building page
 */
export const ValueSetSelection: React.FC<ConditionSelectionProps> = ({
  queryName,
  selectedConditions,
  valueSetsByCondition,
}) => {
  const focusRef = useRef<HTMLInputElement | null>(null);
  const [activeCondition, setActiveCondition] = useState<string>("");
  const [_searchFilter, setSearchFilter] = useState<string>();
  const [selectedValueSets, setSelectedValueSets] =
    useState<ConditionToConceptTypeToValueSetGroupingMap>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [allConditions, setAllConditions] =
    useState<CategoryNameToConditionOptionMap>({});
  const [addedConditions, setAddedConditions] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (queryName == "" || queryName == undefined) {
      focusRef?.current?.focus();
    }

    const first = Object.keys(selectedConditions)[0];
    const id = Object.keys(selectedConditions[first])[0];
    setActiveCondition(id);

    // Fetch all conditions for rendering in the drawer
    async function fetchConditions() {
      try {
        const { categoryToConditionArrayMap } = await getConditionsData();
        setAllConditions(
          groupConditionDataByCategoryName(categoryToConditionArrayMap),
        );
      } catch (error) {
        console.error("Error fetching conditions:", error);
      }
    }

    // Group value sets by condition ID for use in the selection table
    const groupedValueSetByCondition: ConditionToConceptTypeToValueSetGroupingMap =
      groupValueSetGroupingByConditionId(valueSetsByCondition);

    fetchConditions();
    return () => {
      setSelectedValueSets(groupedValueSetByCondition);
    };
  }, [queryName, selectedConditions, valueSetsByCondition]);

  const handleAddCondition = () => {
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Dynamically render condition codes grouped by category
  const toggleAddCondition = (id: string) => {
    setAddedConditions((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
    showToastConfirmation({
      body: `Condition has been successfully added.`,
    });
  };

  const conditionUpdate = Object.entries(allConditions).map(
    ([category, conditions]) => (
      <div key={category}>
        <div className={styles.conditionDrawerHeader}>{category}</div>
        <div>
          {Object.entries(conditions).map(([id, condition]) => (
            <div key={id} className={styles.conditionItem}>
              <span>{formatDiseaseDisplay(condition.name)}</span>
              {addedConditions.has(id) ? (
                <span className={styles.addedButton}>Added</span>
              ) : (
                <span
                  className={styles.addButton}
                  role="button"
                  onClick={() => toggleAddCondition(id)}
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

  const handleSelectedValueSetUpdate =
    (conditionId: string) =>
    (vsType: DibbsConceptType) =>
    (vsName: string) =>
    (vsGrouping: VsGrouping) =>
    (dibbsValueSets: DibbsValueSet[]) => {
      setSelectedValueSets(
        (prevState: ConditionToConceptTypeToValueSetGroupingMap) => {
          const updatedState: ConditionToConceptTypeToValueSetGroupingMap =
            structuredClone(prevState);
          updatedState[conditionId][vsType][vsName] = {
            ...vsGrouping,
            items: [
              { ...dibbsValueSets[0], concepts: dibbsValueSets[0].concepts },
            ],
          };
          return updatedState;
        },
      );
    };

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
                onClick={handleAddCondition}
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
            {selectedValueSets && activeCondition && (
              <SelectionTable
                vsTypeLevelOptions={selectedValueSets[activeCondition]}
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
        onClose={handleCloseDrawer}
        onSave={() => {}} //TODO: Add save handler logic
        hasChanges={false}
      />
    </div>
  );
};
