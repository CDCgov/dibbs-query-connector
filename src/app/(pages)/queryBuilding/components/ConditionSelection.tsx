"use client";

import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { CategoryToConditionArrayMap, NestedQuery } from "../utils";
import ConditionColumnDisplay from "../buildFromTemplates/ConditionColumnDisplay";
import SearchField from "@/app/ui/designSystem/searchField/SearchField";
import { FormError } from "../buildFromTemplates/BuildFromTemplates";
import { CONDITION_DRAWER_SEARCH_PLACEHOLDER } from "./utils";
import { formatDiseaseDisplay } from "../utils";
import Link from "next/link";

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
        "background-dark margin-top-4 ",
        styles.templateContainer,
      )}
    >
      <div className="display-flex flex-column flex-align-center margin-bottom-3 width-full">
        <h2 className="margin-y-0-important">Start from template(s)</h2>
        <p>
          Don't see what you're looking for? You can also{" "}
          {/* TODO: link to "Select" mode of Code library page */}
          <Link href={""} title={""} className={styles.startFromScratchLink}>
            start from scratch.
          </Link>
        </p>
      </div>
      <div className={classNames(styles.conditionSelectionForm, "radius-lg")}>
        <SearchField
          id="templateSearch"
          placeholder={CONDITION_DRAWER_SEARCH_PLACEHOLDER}
          className={classNames(
            "maxw-mobile margin-x-auto margin-top-0 margin-bottom-2",
          )}
          onChange={(e) => {
            e.preventDefault();
            setSearchFilter(e.target.value);
          }}
        />

        {categoryToConditionsMap && (
          <>
            {(() => {
              const conditionIdToNameMap: { [id: string]: string } = {};
              Object.values(categoryToConditionsMap)
                .flat()
                .forEach((c) => {
                  conditionIdToNameMap[c.id] = c.name;
                });

              return (
                <>
                  <div
                    className="margin-bottom-4 display-flex flex-row flex-wrap flex-align-center flex-justify-center"
                    data-testid="selected-pill-container"
                  >
                    {Object.entries(categoryToConditionsMap)
                      .flatMap(([_, conditions]) => conditions)
                      .filter((condition) =>
                        constructedQuery.hasOwnProperty(condition.id),
                      )
                      .map((condition) => (
                        <div
                          key={condition.id}
                          className={classNames(
                            "display-flex flex-align-center margin-right-1 margin-bottom-1 padding-x-2 padding-y-1 border-radius-md",
                            styles.bluePill,
                          )}
                        >
                          <span className="margin-right-1">
                            {formatDiseaseDisplay(condition.name)}
                          </span>
                          <button
                            type="button"
                            className="bg-transparent border-0 cursor-pointer"
                            onClick={() =>
                              handleConditionUpdate(condition.id, true)
                            }
                            aria-label={`Remove ${formatDiseaseDisplay(
                              condition.name,
                            )}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>

                  <ConditionColumnDisplay
                    constructedQuery={constructedQuery}
                    handleConditionUpdate={handleConditionUpdate}
                    categoryToConditionsMap={categoryToConditionsMap}
                    searchFilter={searchFilter}
                    formError={formError}
                    setFormError={setFormError}
                  />
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
};
