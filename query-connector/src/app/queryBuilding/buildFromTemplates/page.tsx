"use client";

import Backlink from "@/app/query/components/backLink/Backlink";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { useRouter } from "next/navigation";
import { Label, TextInput } from "@trussworks/react-uswds";
import { useEffect, useRef, useState } from "react";

import { getConditionsData } from "@/app/database-service";
import {
  CategoryNameToConditionOptionMap,
  ConditionIdToValueSetArray,
  mapFetchedDataToFrontendStructure,
} from "../utils";
import { ConditionSelection } from "../components/ConditionSelection";
import { ValueSetSelection } from "../components/ValueSetSelection";
import SiteAlert from "@/app/query/designSystem/SiteAlert";
import { BuildStep } from "../../constants";
import LoadingView from "../../query/components/LoadingView";

export type FormError = {
  queryName: boolean;
  selectedConditions: boolean;
};

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
  const [buildStep, setBuildStep] = useState<BuildStep>("condition");
  const [loading, setLoading] = useState<boolean>(false);
  const [queryName, setQueryName] = useState<string>("");
  const [fetchedConditions, setFetchedConditions] =
    useState<CategoryNameToConditionOptionMap>();
  const [selectedConditions, setSelectedConditions] =
    useState<CategoryNameToConditionOptionMap>();
  const [formError, setFormError] = useState<FormError>({
    queryName: false,
    selectedConditions: false,
  });
  const [conditionValueSets, setConditionValueSets] =
    useState<ConditionIdToValueSetArray>();

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

  // ensures the fetchedConditions' checkbox statuses match
  // the data in selectedCondtiions
  function updateFetchedConditionIncludeStatus(
    selectedConditions: CategoryNameToConditionOptionMap,
  ) {
    const prevFetch = structuredClone(fetchedConditions);
    Object.entries(selectedConditions).map(
      ([category, conditionsByCategory]) => {
        Object.entries(conditionsByCategory).flatMap(
          ([conditionId, conditionObj]) => {
            if (prevFetch) {
              const prevValues = prevFetch[category][conditionId];
              prevFetch[category][conditionId] = {
                name: prevValues.name,
                include: conditionObj.include,
              };
              return setFetchedConditions(prevFetch);
            }
          },
        );
      },
    );
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
            // TODO: this can be tidied up...
            if (buildStep == "valueset") {
              setBuildStep("condition");
              updateFetchedConditionIncludeStatus(selectedConditions ?? {});
            } else {
              router.push("/queryBuilding");
            }
          }}
          // TODO: tidy this too
          label={
            buildStep == "valueset"
              ? "Back to condition selection"
              : "Back to My queries"
          }
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
              setSelectedConditions={setSelectedConditions}
              setFormError={setFormError}
              formError={formError}
              validateForm={validateForm}
              loading={loading}
              setLoading={setLoading}
              setConditionValueSets={setConditionValueSets}
            />
          )}
          {/* Step Two: Select Conditions */}
          {buildStep == "valueset" && (
            <ValueSetSelection
              setBuildStep={setBuildStep}
              queryName={queryName}
              selectedConditions={selectedConditions ?? {}}
              valueSetsByCondition={conditionValueSets ?? {}}
            />
          )}
        </div>
        {loading && <LoadingView loading={loading} />}
      </div>
    </>
  );
}
