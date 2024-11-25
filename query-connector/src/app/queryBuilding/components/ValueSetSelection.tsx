"use client";

import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { getConditionsData } from "@/app/database-service";
import {
  CategoryNameToConditionOptionMap,
  mapFetchedDataToFrontendStructure,
} from "../utils";
import { BuildStep } from "@/app/constants";
import SearchField from "@/app/query/designSystem/searchField/SearchField";
import { Icon } from "@trussworks/react-uswds";
import { formatDiseaseDisplay } from "../utils";

type ConditionSelectionProps = {
  setBuildStep: (buildStep: BuildStep) => void;
  fetchedConditions: CategoryNameToConditionOptionMap;
  selectedConditions: CategoryNameToConditionOptionMap;
  setFetchedConditions: Dispatch<
    SetStateAction<CategoryNameToConditionOptionMap | undefined>
  >;
  setSelectedConditions: Dispatch<
    SetStateAction<CategoryNameToConditionOptionMap | undefined>
  >;
  queryName: string;
};

/**
 * Display component for a condition on the query building page
 * @param root0 - params
 * @param root0.fetchedConditions - ID of the condition to reference
 * @param root0.setBuildStep - Redirect function to handle view routing
 * @param root0.selectedConditions - name of condition to display
 * @param root0.setFetchedConditions - listener function for checkbox
 * selection
 * @param root0.setSelectedConditions - current checkbox selection status
 * @param root0.queryName - current checkbox selection status
 * @returns A component for display to redner on the query building page
 */
export const ValueSetSelection: React.FC<ConditionSelectionProps> = ({
  fetchedConditions,
  selectedConditions,
  setBuildStep,
  setFetchedConditions,
  setSelectedConditions,
  queryName,
}) => {
  const focusRef = useRef<HTMLInputElement | null>(null);

  const [searchFilter, setSearchFilter] = useState<string>();

  useEffect(() => {
    console.log(selectedConditions);
    let isSubscribed = true;

    if (queryName == "" || queryName == undefined) {
      focusRef?.current?.focus();
    }

    async function fetchConditionsAndUpdateState() {
      const { categoryToConditionArrayMap } = await getConditionsData();

      if (isSubscribed) {
        setFetchedConditions(
          mapFetchedDataToFrontendStructure(categoryToConditionArrayMap)
        );
      }
    }

    fetchConditionsAndUpdateState().catch(console.error);
    return () => {
      isSubscribed = false;
    };
  }, []);

  // Makes the conditionId more easily accessible within the group
  // of selected conditions
  const includedConditionsWithIds = Object.entries(selectedConditions)
    .map(([_, conditionsByCategory]) =>
      Object.entries(conditionsByCategory).flatMap(
        ([conditionId, conditionObj]) => {
          return { id: conditionId, name: conditionObj.name };
        }
      )
    )
    .flatMap((conditionsByCategory) => conditionsByCategory);

  return (
    <div
      className={classNames(
        "bg-gray-5 margin-top-4 ",
        styles.valueSetTemplateContainer
      )}
    >
      <div className={styles.valueSetTemplateContainer__inner}>
        <div className={styles.valueSetTemplate__left}>
          <div className={styles.conditionList}>
            <div className={styles.controls}>
              <div className={styles.conditionsTitle}>Conditions</div>
              <div
                className={styles.addCondition}
                role="button"
                aria-role="button"
                onClick={handleAddCondition}
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
                <div key={condition.id} className={styles.conditionCard}>
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
        </div>
      </div>
    </div>
  );
};
