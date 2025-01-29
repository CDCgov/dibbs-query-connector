"use client";

import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { CategoryToConditionArrayMap, NestedQuery } from "../utils";
import ConditionColumnDisplay from "../buildFromTemplates/ConditionColumnDisplay";
import SearchField from "@/app/ui/designSystem/searchField/SearchField";
import { FormError } from "../buildFromTemplates/BuildFromTemplates";
import { CONDITION_DRAWER_SEARCH_PLACEHOLDER } from "./constants";

type ConditionSelectionProps = {
  categoryToConditionsMap: CategoryToConditionArrayMap;
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
 * @param root0.constructedQuery - current state of the built query
 * @param root0.handleConditionUpdate - update function for condition addition and
 * removal
 * @param root0.categoryToConditionsMap - ID of the condition to reference
 * @param root0.queryName - current checkbox selection status
 * @param root0.formError - indicates missing or incorrect form data
 * @param root0.setFormError - state function that updates the status of the
 * condition selection form input data
 * @returns A component for display to redner on the query building page
 */
export const ConditionSelection: React.FC<ConditionSelectionProps> = ({
  categoryToConditionsMap,
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
          placeholder={CONDITION_DRAWER_SEARCH_PLACEHOLDER}
          className={classNames(
            "maxw-mobile margin-x-auto margin-top-0 margin-bottom-4",
          )}
          onChange={(e) => {
            e.preventDefault();
            setSearchFilter(e.target.value);
          }}
        />

        {categoryToConditionsMap && (
          <ConditionColumnDisplay
            constructedQuery={constructedQuery}
            handleConditionUpdate={handleConditionUpdate}
            categoryToConditionsMap={categoryToConditionsMap}
            searchFilter={searchFilter}
            formError={formError}
            setFormError={setFormError}
          />
        )}
      </div>
    </div>
  );
};
