"use client";

import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { Button } from "@trussworks/react-uswds";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { getConditionsData } from "@/app/database-service";
import {
  CategoryNameToConditionOptionMap,
  mapFetchedDataToFrontendStructure,
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
};

/**
 * Display component for a condition on the query building page
 * @param root0 - params
 * @param root0.fetchedConditions - ID of the condition to reference
 * @param root0.selectedConditions - name of condition to display
 * @param root0.setBuildStep - Redirect function to handle view routing
 * @param root0.setFetchedConditions - listener function for checkbox
 * selection
 * @param root0.setSelectedConditions - current checkbox selection status
 * @param root0.queryName - current checkbox selection status
 * @param root0.validateForm - function that checks for a valid query name
 * and at least one selected condition
 * @param root0.formError - indicates missing or incorrect form data
 * @param root0.setFormError - state function that updates the status of the
 * condition selection form input data
 * @returns A component for display to redner on the query building page
 */
export const ConditionSelection: React.FC<ConditionSelectionProps> = ({
  fetchedConditions,
  selectedConditions,
  setBuildStep,
  setFetchedConditions,
  setSelectedConditions,
  queryName,
  validateForm,
  formError,
  setFormError,
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
          mapFetchedDataToFrontendStructure(categoryToConditionArrayMap)
        );
      }
    }

    fetchConditionsAndUpdateState().catch(console.error);
    return () => {
      isSubscribed = false;
    };
  }, []);

  function handleCreateQueryClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    validateForm();
    if (!!queryName && !formError.queryName && !formError.selectedConditions) {
      // continue to next page
      setBuildStep("valueset");
    }
  }

  return (
    <div
      className={classNames(
        "bg-gray-5 margin-top-4 ",
        styles.queryTemplateContainer
      )}
    >
      <div className="display-flex flex-justify flex-align-end margin-bottom-3 width-full">
        <h2 className="margin-y-0-important">Select condition(s)</h2>
        <Button
          className="margin-0"
          type={"button"}
          disabled={formError.selectedConditions}
          onClick={handleCreateQueryClick}
        >
          Create query
        </Button>
      </div>
      <div className={classNames(styles.querySelectionForm, "radius-lg")}>
        <SearchField
          id="conditionTemplateSearch"
          placeholder="Search conditions"
          className={classNames(
            "maxw-mobile margin-x-auto margin-top-0 margin-bottom-4"
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
            setFetchedConditions={setFetchedConditions}
            formError={formError}
            setFormError={setFormError}
          />
        )}
      </div>
    </div>
  );
};
