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
        styles.vsSearch__container
      )}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <div
          className="left-column"
          style={{
            display: "flex",
            flexDirection: "row",
            minWidth: "18rem",
            justifyContent: "space-between",
            padding: "1rem 0.5rem !important",
          }}
        >
          <div
            className="condition-list flex-column"
            style={{ padding: "1rem 0.5rem", width: "100%" }}
          >
            <div
              className="controls display-flex"
              style={{
                justifyContent: "space-between",
                padding: "0.5rem",
              }}
            >
              <div
                style={{
                  width: "104px",
                  color: "#919191",
                  fontSize: "19px",
                }}
              >
                Conditions
              </div>
              <div
                style={{
                  fontSize: "16px",
                  color: "#005EA2",
                  lineHeight: " 18.8px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  width: "59px",
                }}
              >
                <Icon.Add
                  aria-label="Plus sign icon indicating addition"
                  className="usa-icon"
                  size={3}
                  color="#005EA2"
                />{" "}
                <span>ADD</span>
              </div>
            </div>

            {Object.values(includedConditionsWithIds).map((condition) => {
              return (
                <div
                  key={condition.id}
                  className="condition cards"
                  style={{
                    background: "white",
                    borderRadius: "4px",
                    padding: "1rem",
                    lineHeight: "22px",
                    marginTop: " 0.5rem",
                    color: "#111111",
                  }}
                >
                  {formatDiseaseDisplay(condition.name)}
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.vsSearch__right}>
          <div className={styles.vsSearch__section}>
            {" "}
            <SearchField
              id="valueSetTemplateSearch"
              placeholder="Search labs, medications, conditions"
              className={styles.vsSearch}
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
