"use client";

import styles from "../conditionTemplateSelection/conditionTemplateSelection.module.scss";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { getConditionsData } from "@/app/database-service";
import {
  CategoryNameToConditionNameMap,
  groupConditionDataByCategoryName,
  ConditionIdToValueSetArrayMap,
  NestedQuery,
} from "../utils";
import ConditionColumnDisplay from "../conditionTemplateSelection/ConditionColumnDisplay";
import SearchField from "@/app/query/designSystem/searchField/SearchField";
import { FormError } from "../conditionTemplateSelection/ConditionTemplateSelection";

type ConditionSelectionProps = {
  fetchedConditions: CategoryNameToConditionNameMap;
  constructedQuery: NestedQuery;
  handleConditionUpdate: (conditionId: string, checked: boolean) => void;
  queryName: string | undefined;
  validateForm: () => void;
  setFormError: Dispatch<SetStateAction<FormError>>;
  formError: FormError;
  setLoading: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
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
  constructedQuery,
  handleConditionUpdate,
  queryName,
  formError,
  setFormError,
}) => {
  const focusRef = useRef<HTMLInputElement | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>();

  useEffect(() => {
    if (queryName == "" || queryName == undefined) {
      focusRef?.current?.focus();
    }
  }, []);

  return (
    <div
      className={classNames(
        "bg-gray-5 margin-top-4 ",
        styles.conditionTemplateContainer,
      )}
    >
      <div className="display-flex flex-justify flex-align-end margin-bottom-3 width-full">
        <h2 className="margin-y-0-important">Select condition template(s)</h2>
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
            constructedQuery={constructedQuery}
            handleConditionUpdate={handleConditionUpdate}
            categoryToConditionsMap={fetchedConditions}
            searchFilter={searchFilter}
            formError={formError}
            setFormError={setFormError}
          />
        )}
      </div>
    </div>
  );
};
