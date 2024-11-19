"use client";

import Backlink from "@/app/query/components/backLink/Backlink";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { useRouter } from "next/navigation";
import { Label, TextInput } from "@trussworks/react-uswds";
import { useEffect, useRef, useState } from "react";
import { getConditionsData } from "@/app/database-service";
import {
  CategoryNameToConditionOptionMap,
  mapFetchedDataToFrontendStructure,
} from "../utils";
import { ConditionSelection } from "../components/ConditionSelection";
import { ValueSetSelection } from "../components/ValueSetSelection";
import SiteAlert from "@/app/query/designSystem/SiteAlert";

export type FormError = {
  queryName: boolean;
  selectedConditions: boolean;
};

import { BuildStep } from "../../constants";
// import classNames from "classnames";
/**
 * The query building page
 * @returns the component for the query building page
 */
export default function QueryTemplateSelection() {
  const router = useRouter();
  const focusRef = useRef<HTMLInputElement | null>(null);
  const [buildStep, setBuildStep] = useState<BuildStep>("condition");

  const [queryName, setQueryName] = useState<string>("");
  // const [searchFilter, setSearchFilter] = useState<string>();
  const [fetchedConditions, setFetchedConditions] =
    useState<CategoryNameToConditionOptionMap>();
  const [selectedConditions, _setSelectedConditions] =
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
          mapFetchedDataToFrontendStructure(categoryToConditionArrayMap)
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
      <div
        className="main-container__wide"
        style={{
          display: "flex",
          flexDirection: "column",
          flex: "auto",
          marginBottom: "0!important",
        }}
      >
        <Backlink
          onClick={() => {
            router.push("/queryBuilding");
          }}
          label={"Back to My queries"}
        />
        <div className="customQuery__header">
          <h1 className={styles.queryTitle}>Custom query</h1>
          <Label htmlFor="queryNameInput" className="margin-top-0-important">
            Query name <span style={{ color: "#919191" }}>(required)</span>
          </Label>
          <TextInput
            inputRef={focusRef}
            id="queryNameInput"
            name="queryNameInput"
            type="text"
            className="maxw-mobile"
            required
            onChange={(event) => {
              setQueryName(event.target.value);
            }}
          />
        </div>
        <div style={{ flex: "auto", display: "flex" }}>
          {/* Step One: Select Conditions */}
          {buildStep == "condition" && fetchedConditions && (
            <ConditionSelection
              setBuildStep={setBuildStep}
              queryName={queryName}
              fetchedConditions={fetchedConditions ?? {}}
              selectedConditions={selectedConditions ?? {}}
              setFetchedConditions={setFetchedConditions}
              setSelectedConditions={_setSelectedConditions}
            />
          )}
          {/* Step Two: Select Conditions */}
          {buildStep == "valueset" && (
            <ValueSetSelection
              setBuildStep={setBuildStep}
              queryName={queryName}
              fetchedConditions={fetchedConditions ?? {}}
              selectedConditions={selectedConditions ?? {}}
              setFetchedConditions={setFetchedConditions}
              setSelectedConditions={_setSelectedConditions}
            />
          )}
        </div>
      </div>
    </>
  );
}
