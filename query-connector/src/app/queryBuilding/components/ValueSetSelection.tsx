"use client";

import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { useEffect, useRef, useState } from "react";
import classNames from "classnames";

import {
  CategoryNameToConditionOptionMap,
  ConditionIdToValueSetArrayMap,
} from "../utils";
import SearchField from "@/app/query/designSystem/searchField/SearchField";
import { Icon } from "@trussworks/react-uswds";

import {
  formatDiseaseDisplay,
  ConditionToConceptTypeToValueSetGroupingMap,
} from "../utils";
import { SelectionTable } from "./SelectionTable";

import Drawer from "@/app/query/designSystem/drawer/Drawer";
import {
  VsGrouping,
  groupValueSetGroupingByConditionId,
} from "@/app/utils/valueSetTranslation";
import { DibbsConceptType, DibbsValueSet } from "@/app/constants";

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
 * @returns A component for display to redner on the query building page
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

  useEffect(() => {
    if (queryName == "" || queryName == undefined) {
      focusRef?.current?.focus();
    }

    const first = Object.keys(selectedConditions)[0];
    const id = Object.keys(selectedConditions[first])[0];
    setActiveCondition(id);
    const groupedValueSetByCondition: ConditionToConceptTypeToValueSetGroupingMap =
      groupValueSetGroupingByConditionId(valueSetsByCondition);

    return () => {
      setSelectedValueSets(groupedValueSetByCondition);
    };
  }, []);

  const handleAddCondition = () => {
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const codes = Object.entries(allConditions).map(([category, conditions]) => (
    <div key={category}>
      <h4>{category}</h4>
      <ul>
        {Object.entries(conditions).map(([id, condition]) => (
          <li key={id}>{formatDiseaseDisplay(condition.name)}</li>
        ))}
      </ul>
    </div>
  ));

  // Makes the conditionId more easily accessible within the group
  // of selected conditions
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
      setSelectedValueSets((prevState) => {
        prevState[conditionId][vsType][vsName] = {
          ...vsGrouping,
          items: [
            { ...dibbsValueSets[0], concepts: dibbsValueSets[0].concepts },
          ],
        };
        return structuredClone(prevState);
      });
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
        toRender={<div>{codes}</div>}
        toastMessage="Condition has been successfully added."
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onSave={() => {}} //TODO
        hasChanges={false}
      />
    </div>
  );
};
