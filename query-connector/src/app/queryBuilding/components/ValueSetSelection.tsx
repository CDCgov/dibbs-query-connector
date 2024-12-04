"use client";

import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import {
  // Dispatch,
  // SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import classNames from "classnames";

import {
  CategoryNameToConditionOptionMap,
  ConditionIdToValueSetArray,
} from "../utils";
import { BuildStep } from "@/app/constants";
import SearchField from "@/app/query/designSystem/searchField/SearchField";
import { Icon } from "@trussworks/react-uswds";

import { formatDiseaseDisplay, ConditionToValueSetMap } from "../utils";
import {
  GroupedValueSet,
  mapValueSetsToValueSetType,
  groupValueSetsByNameAuthorSystem,
} from "../../query/components/customizeQuery/customizeQueryUtils";
import { DibbsValueSetType } from "../../constants";
import { SelectionTable } from "./SelectionTable";

type ConditionSelectionProps = {
  queryName: string;
  setBuildStep: (buildStep: BuildStep) => void;
  selectedConditions: CategoryNameToConditionOptionMap;
  valueSetsByCondition: ConditionIdToValueSetArray;
};

/**
 * Display component for a condition on the query building page
 * @param root0 - params
 * @param root0.queryName - current checkbox selection status
//  * @param root0.setBuildStep - Redirect function to handle view routing
 * @param root0.selectedConditions - name of condition to display
 * @param root0.valueSetsByCondition - name of condition to display
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
  const [valueSets, setValueSets] = useState<ConditionToValueSetMap>({});

  useEffect(() => {
    if (queryName == "" || queryName == undefined) {
      focusRef?.current?.focus();
    }

    const first = Object.keys(selectedConditions)[0];
    const id = Object.keys(selectedConditions[first])[0];

    setActiveCondition(id);

    const groupedValueSetByCondition: ConditionToValueSetMap = Object.entries(
      valueSetsByCondition
    )
      .map(([conditionId, valSet]) => {
        // results for each condition
        const results: {
          [vsType in DibbsValueSetType]: {
            [vsNameAuthorSystem: string]: GroupedValueSet;
          };
        } = {
          labs: {},
          conditions: {},
          medications: {},
        };

        const valueSetsByNameAuthorSystem =
          groupValueSetsByNameAuthorSystem(valSet);

        Object.entries(valueSetsByNameAuthorSystem).map(
          ([nameAuthorSystem, groupedValueSet]) => {
            const mappedSets = mapValueSetsToValueSetType(
              groupedValueSet.items
            );

            Object.entries(mappedSets).forEach(([valueSetTypeKey, items]) => {
              // the sieving function below accounts for the case that a GroupedValueSet
              // might have items that belong to more than one ValueSetType.
              // In practice, this doesn't occur very often / will result in empty
              // GroupedValueSets (ie the groupings on the other tabs) that we don't
              // want to display, so we should filter those out.
              if (items.length > 0) {
                results[valueSetTypeKey as DibbsValueSetType][
                  nameAuthorSystem
                ] = {
                  ...groupedValueSet,
                  items: items,
                };
              }
            });

            return;
          }
        );

        return { [conditionId]: results }; // the value of groupedValueSetByCondition
      })
      .reduce(function (result, current) {
        const conditionId = Object.keys(current)[0];
        result[conditionId] = {
          labs: current[conditionId].labs,
          medications: current[conditionId].medications,
          conditions: current[conditionId].conditions,
        };
        return result;
      }, {});

    return () => {
      setValueSets(groupedValueSetByCondition);
    };
  }, []);

  const handleAddCondition = () => {
    console.log("clicky");
  };

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
            {valueSets && (
              <SelectionTable
                conditionId={activeCondition ?? ""}
                valueSetsForCondition={valueSets[activeCondition]}
                setValueSets={setValueSets}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
