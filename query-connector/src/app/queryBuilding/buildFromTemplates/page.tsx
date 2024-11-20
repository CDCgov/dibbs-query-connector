"use client";

import Backlink from "@/app/query/components/backLink/Backlink";
import styles from "./buildfromTemplate.module.scss";
import { useRouter } from "next/navigation";
import { Button, Label, TextInput } from "@trussworks/react-uswds";
import { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { getConditionsData } from "@/app/database-service";
import {
  CategoryNameToConditionOptionMap,
  mapFetchedDataToFrontendStructure,
} from "../utils";
import ConditionColumnDisplay from "./ConditionColumnDisplay";
import SearchField from "@/app/query/designSystem/searchField/SearchField";
import SiteAlert from "@/app/query/designSystem/SiteAlert";

export type FormError = {
  queryName: boolean;
  selectedConditions: boolean;
};

/**
 * The query building page
 * @returns the component for the query building page
 */
export default function QueryTemplateSelection() {
  const router = useRouter();
  const focusRef = useRef<HTMLInputElement | null>(null);

  const [queryName, setQueryName] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>();
  const [fetchedConditions, setFetchedConditions] =
    useState<CategoryNameToConditionOptionMap>();
  const [selectedConditions, setSelectedConditions] =
    useState<CategoryNameToConditionOptionMap>();
  const [formError, setFormError] = useState<FormError>({
    queryName: false,
    selectedConditions: false,
  });

  useEffect(() => {
    let isSubscribed = true;

    if (queryName == "" || queryName == undefined) {
      focusRef?.current?.focus();
    }

    // enables/disables the Create Query button based on selectedConditions
    if (!selectedConditions || Object.values(selectedConditions).length < 1) {
      setFormError({ ...formError, ...{ selectedConditions: true } });
    } else {
      setFormError({ ...formError, ...{ selectedConditions: false } });
    }

    // clear the error when the user enters a query name
    if (formError.queryName && !!queryName) {
      validateForm();
    }

    async function fetchConditionsAndUpdateState() {
      const { categoryToConditionArrayMap } = await getConditionsData();

      if (isSubscribed) {
        setFetchedConditions(
          mapFetchedDataToFrontendStructure(categoryToConditionArrayMap),
        );
      }
    }

    fetchConditionsAndUpdateState().catch(console.error);

    return () => {
      isSubscribed = false;
    };
  }, [selectedConditions, queryName]);

  function handleCreateQueryClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    validateForm();
    if (!!queryName && !formError.queryName && !formError.selectedConditions) {
      submitForm();
    }
  }

  const validateForm = () => {
    if (!queryName || queryName == "") {
      focusRef?.current?.focus();
    }

    return setFormError({
      ...formError,
      ...{ queryName: !queryName, selectedConditions: !atLeastOneItemSelected },
    });
  };

  const submitForm = () => {
    // TODO: do something with selectedConditions on next step/page
    // will be addressed in https://linear.app/skylight-cdc/issue/QUE-65/create-the-valueset-selection-page
    console.log(selectedConditions);
  };

  const atLeastOneItemSelected =
    selectedConditions && Object.values(selectedConditions).length > 0;

  return (
    <>
      <SiteAlert />
      <div className="main-container__wide">
        <Backlink
          onClick={() => {
            router.push("/queryBuilding");
          }}
          label={"Back to My queries"}
        />
        <h1 className={styles.queryTitle}>Custom query</h1>
        <Label htmlFor="queryNameInput" className="margin-top-0-important">
          Query name <span style={{ color: "#919191" }}>(required)</span>
        </Label>
        <TextInput
          inputRef={focusRef}
          id="queryNameInput"
          name="queryNameInput"
          type="text"
          style={
            formError.queryName && !queryName
              ? { border: "1px solid #E41D3D" }
              : {}
          }
          className="maxw-mobile"
          required
          onChange={(event) => {
            setQueryName(event.target.value);
          }}
        />
        <span
          className="inline-error queryName-error"
          style={!!queryName ? { display: "none" } : { color: "#E41D3D" }}
          hidden={formError.queryName == false}
        >
          Please enter a query name.
        </span>
        <div
          className={classNames(
            "bg-gray-5 margin-top-4 ",
            styles.queryTemplateContainer,
          )}
        >
          <div className="display-flex flex-justify flex-align-end margin-bottom-3 width-full">
            <h2 className="margin-y-0-important">Select condition(s)</h2>
            <Button
              className="margin-0"
              type={"button"}
              disabled={formError.selectedConditions}
              title={
                formError.selectedConditions
                  ? "Select at least one condition below"
                  : !queryName
                    ? "Enter a query name, then click to create your query"
                    : "Click to create your query"
              }
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
                setFetchedConditions={setFetchedConditions}
                setFormError={setFormError}
                formError={formError}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
