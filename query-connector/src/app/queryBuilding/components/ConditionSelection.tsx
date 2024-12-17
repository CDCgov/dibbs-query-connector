"use client";

import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { getConditionsData } from "@/app/database-service";
import {
  CategoryNameToConditionOptionMap,
  groupConditionDataByCategoryName,
  ConditionIdToValueSetArray,
} from "../utils";
import ConditionColumnDisplay from "../buildFromTemplates/ConditionColumnDisplay";
import SearchField from "@/app/query/designSystem/searchField/SearchField";
import { BuildStep } from "@/app/constants";
import { FormError } from "../buildFromTemplates/page";

type ConditionSelectionProps = {
  fetchedConditions: CategoryNameToConditionOptionMap;
  selectedConditions: CategoryNameToConditionOptionMap;
  setBuildStep: (buildStep: BuildStep) => void;

  setFetchedConditions: Dispatch<
    SetStateAction<CategoryNameToConditionOptionMap | undefined>
  >;
  setSelectedConditions: Dispatch<
    SetStateAction<CategoryNameToConditionOptionMap | undefined>
  >;
  queryName: string;
  validateForm: () => void;
  setFormError: Dispatch<SetStateAction<FormError>>;
  formError: FormError;
  setLoading: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  setConditionValueSets: Dispatch<
    SetStateAction<ConditionIdToValueSetArray | undefined>
  >;
  updateFetched: (selectedConditions: CategoryNameToConditionOptionMap) => void;
};

/**
 * Display component for a condition on the query building page
 * @param root0 - params
 * @param root0.fetchedConditions - ID of the condition to reference
 * @param root0.selectedConditions - name of condition to display
 * @param root0.setFetchedConditions - listener function for checkbox
 * selection
 * @param root0.setSelectedConditions - current checkbox selection status
 * @param root0.queryName - current checkbox selection status
 * @param root0.formError - indicates missing or incorrect form data
 * @param root0.setFormError - state function that updates the status of the
 * condition selection form input data
 * @param root0.updateFetched - tk
 * @returns A component for display to redner on the query building page
 */
export const ConditionSelection: React.FC<ConditionSelectionProps> = ({
  fetchedConditions,
  selectedConditions,
  setFetchedConditions,
  setSelectedConditions,
  queryName,
  formError,
  setFormError,
  updateFetched,
}) => {
  const focusRef = useRef<HTMLInputElement | null>(null);

  const [searchFilter, setSearchFilter] = useState<string>();

  useEffect(() => {
    let isSubscribed = true;

    if (queryName == "" || queryName == undefined) {
      focusRef?.current?.focus();
    }

    async function fetchConditionsAndUpdateState() {
      const { categoryToConditionArrayMap } = await getConditionsData();

      if (isSubscribed) {
        setFetchedConditions(
          groupConditionDataByCategoryName(categoryToConditionArrayMap),
        );
      }
    }

    fetchConditionsAndUpdateState().catch(console.error);
    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <div
      className={classNames(
        "bg-gray-5 margin-top-4 ",
        styles.conditionTemplateContainer,
      )}
    >
      <div className="display-flex flex-justify flex-align-end margin-bottom-3 width-full">
        <h2 className="margin-y-0-important">Select condition(s)</h2>
      </div>
      <div className={classNames(styles.conditionSelectionForm, "radius-lg")}>
        <SearchField
          id="conditionTemplateSearch"
          placeholder="Search conditions"
          className={classNames(
            "maxw-mobile margin-x-auto margin-top-0 margin-bottom-4",
          )}
          onChange={(e) => {
            e.preventDefault();
            setSearchFilter(e.target.value);
          }}
        />

        {fetchedConditions && (
          <ConditionColumnDisplay
            selectedConditions={selectedConditions ?? {}}
            setSelectedConditions={setSelectedConditions}
            fetchedConditions={fetchedConditions}
            searchFilter={searchFilter}
            formError={formError}
            setFormError={setFormError}
            updateFetched={updateFetched}
          />
        )}
      </div>
    </div>
  );
};
