"use client";

import Backlink from "@/app/query/components/backLink/Backlink";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { Label, TextInput, Button } from "@trussworks/react-uswds";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import {
  getConditionsData,
  getValueSetsAndConceptsByConditionIDs,
} from "@/app/database-service";
import {
  CategoryNameToConditionOptionMap,
  ConditionIdToValueSetArrayMap,
  EMPTY_QUERY_SELECTION,
  generateConditionIdToNameAndCategoryMap,
  groupConditionDataByCategoryName,
} from "../utils";
import { ConditionSelection } from "../components/ConditionSelection";
import { ValueSetSelection } from "../components/ValueSetSelection";
import SiteAlert from "@/app/query/designSystem/SiteAlert";
import { BuildStep } from "../../constants";
import LoadingView from "../../query/components/LoadingView";
import classNames from "classnames";
import { groupConditionConceptsIntoValueSets } from "@/app/utils";
import { SelectedQueryDetails } from "../querySelection/utils";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getSavedQueryDetails } from "@/app/backend/query-building";

export type FormError = {
  queryName: boolean;
  selectedConditions: boolean;
};

type BuildFromTemplatesProps = {
  buildStep: BuildStep;
  setBuildStep: Dispatch<SetStateAction<BuildStep>>;
  selectedQuery: SelectedQueryDetails;
  setSelectedQuery: Dispatch<SetStateAction<SelectedQueryDetails>>;
};

/**
 * The query building page
 * @param root0 params
 * @param root0.selectedQuery - the query to edit or the "create" mode if it
 * doesn't previously
 * @param root0.buildStep - the stage in the build process, used to render
 * subsequent steps
 * @param root0.setBuildStep - setter function to move the app forward
 * @param root0.setSelectedQuery - setter function to update / reset the query
 * being built
 * @returns the component for the query building page
 */
const BuildFromTemplates: React.FC<BuildFromTemplatesProps> = ({
  selectedQuery,
  buildStep,
  setBuildStep,
  setSelectedQuery,
}) => {
  const focusRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [queryName, setQueryName] = useState<string | null>(
    selectedQuery.queryName,
  );

  const [fetchedConditions, setFetchedConditions] =
    useState<CategoryNameToConditionOptionMap>();
  const [selectedConditions, setSelectedConditions] =
    useState<CategoryNameToConditionOptionMap>();
  const [formError, setFormError] = useState<FormError>({
    queryName: false,
    selectedConditions: false,
  });
  const [conditionValueSets, setConditionValueSets] =
    useState<ConditionIdToValueSetArrayMap>();

  function goBack() {
    setQueryName(null);
    setSelectedQuery(EMPTY_QUERY_SELECTION);
    setBuildStep("selection");
  }

  const checkForAddedConditions = (selectedIds: string[]) => {
    const alreadyRetrieved =
      conditionValueSets && Object.keys(conditionValueSets);

    const newIds = selectedIds.filter((id) =>
      alreadyRetrieved?.includes(id) ? false : true,
    );

    return newIds;
  };

  async function getValueSetsForSelectedConditions() {
    const conditionIds =
      selectedConditions &&
      Object.entries(selectedConditions)
        .map(([_, conditionObj]) => {
          return Object.keys(conditionObj);
        })
        .flatMap((ids) => ids);

    const idsToQuery = conditionIds && checkForAddedConditions(conditionIds);
    const idsToRemove =
      conditionValueSets &&
      Object.keys(conditionValueSets).filter(
        (vs) => !conditionIds?.includes(vs),
      );

    const ConditionValueSets: ConditionIdToValueSetArrayMap = {};

    // if there are new ids, we need to query the db
    if (idsToQuery && idsToQuery.length > 0) {
      const results = await getValueSetsAndConceptsByConditionIDs(conditionIds);
      const formattedResults =
        results && groupConditionConceptsIntoValueSets(results);

      // group by Condition ID:
      return Object.values(formattedResults).reduce((acc, resultObj) => {
        if (resultObj.conditionId) {
          const id = resultObj.conditionId;

          if (!acc[id]) {
            acc[id] = [];
          }
          acc[id].push(resultObj);
          return acc;
        }
        return acc;
      }, ConditionValueSets);
    }
    // otherwise, nothing's changed, return existing state
    // after we've removed anything we unchecked
    idsToRemove?.forEach((id) => {
      conditionValueSets && delete conditionValueSets[id];
    });

    return conditionValueSets;
  }

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
          groupConditionDataByCategoryName(categoryToConditionArrayMap),
        );
      }
    }

    fetchConditionsAndUpdateState().catch(console.error);

    return () => {
      isSubscribed = false;
    };
  }, [selectedConditions, queryName]);

  useEffect(() => {
    let isSubscribed = true;

    async function setDefaultSelectedConditions() {
      if (selectedQuery.queryId && fetchedConditions) {
        const result = await getSavedQueryDetails(selectedQuery.queryId);
        const conditionIdToNameMap =
          generateConditionIdToNameAndCategoryMap(fetchedConditions);
        const queryConditions = result?.map((r) => r.conditions_list).flat();

        const updatedConditions: CategoryNameToConditionOptionMap = {};
        queryConditions &&
          queryConditions.forEach((conditionId) => {
            const { category, conditionName } =
              conditionIdToNameMap[conditionId];

            updatedConditions[category] = {
              ...updatedConditions[category],
              [conditionId]: {
                name: conditionName,
                include: true,
              },
            };
          });

        if (isSubscribed) {
          setSelectedConditions((prevState) => {
            // Avoid unnecessary updates if the state is already the same
            const newState = { ...prevState, ...updatedConditions };
            return JSON.stringify(prevState) !== JSON.stringify(newState)
              ? newState
              : prevState;
          });
        }
      }
    }
    setDefaultSelectedConditions().catch(console.error);

    return () => {
      isSubscribed = false;
    };
  }, [fetchedConditions]);

  // ensures the fetchedConditions' checkbox statuses match
  // the data in selectedCondtiions
  function updateFetchedConditionIncludeStatus(
    selectedConditions: CategoryNameToConditionOptionMap,
  ) {
    const prevFetch = structuredClone(fetchedConditions);
    if (prevFetch) {
      Object.entries(selectedConditions).map(
        ([category, conditionsByCategory]) => {
          Object.entries(conditionsByCategory).flatMap(
            ([conditionId, conditionObj]) => {
              const prevValues = prevFetch[category][conditionId];
              prevFetch[category][conditionId] = {
                name: prevValues.name,
                include: conditionObj.include,
              };
              return setFetchedConditions(prevFetch);
            },
          );
        },
      );
    }
  }

  async function handleCreateQueryClick(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    setLoading(true);
    validateForm();
    if (!!queryName && !formError.queryName && !formError.selectedConditions) {
      // fetch valuesets for selected conditions
      const valueSets = await getValueSetsForSelectedConditions();

      setConditionValueSets(valueSets);
      setBuildStep("valueset");
      setLoading(false);
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

  const atLeastOneItemSelected =
    selectedConditions && Object.values(selectedConditions).length > 0;

  return (
    <>
      <SiteAlert />
      <div className={classNames("main-container__wide", styles.mainContainer)}>
        <Backlink
          onClick={() => {
            // TODO: this can be tidied up...
            if (buildStep == "valueset") {
              setBuildStep("condition");
              updateFetchedConditionIncludeStatus(selectedConditions ?? {});
            } else {
              goBack();
            }
          }}
          // TODO: tidy this too
          label={
            buildStep == "valueset"
              ? "Back to condition selection"
              : "Back to My queries"
          }
        />
        <ToastContainer
          position="bottom-left"
          icon={false}
          stacked
          hideProgressBar
        />
        <div className="customQuery__header">
          <h1 className={styles.queryTitle}>Custom query</h1>
          <div className={styles.customQuery__controls}>
            <div className={styles.customQuery__name}>
              <Label
                htmlFor="queryNameInput"
                className="margin-top-0-important"
              >
                Query name <span style={{ color: "#919191" }}>(required)</span>
              </Label>
              <TextInput
                inputRef={focusRef}
                id="queryNameInput"
                name="queryNameInput"
                type="text"
                className="maxw-mobile"
                defaultValue={queryName ?? ""}
                required
                onChange={(event) => {
                  setQueryName(event.target.value);
                }}
              />
            </div>
            <div className={styles.customQuery__saveButton}>
              <Button
                className="margin-0"
                type={"button"}
                disabled={
                  formError.selectedConditions ||
                  !queryName ||
                  loading ||
                  buildStep == "valueset" // hard-coding this off for now; should be handled in concept selection ticket
                }
                title={
                  buildStep == "valueset"
                    ? "Save query"
                    : formError.selectedConditions || formError.queryName
                      ? "Enter a query name and condition"
                      : "Click to create your query"
                }
                onClick={
                  buildStep == "condition"
                    ? handleCreateQueryClick
                    : () => console.log("save query")
                }
              >
                {buildStep == "condition" ? "Customize query" : "Save query"}
              </Button>
            </div>
          </div>
        </div>
        <div className="display-flex flex-auto">
          {/* Step One: Select Conditions */}
          {buildStep == "condition" &&
            fetchedConditions &&
            queryName !== null && (
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
                updateFetched={updateFetchedConditionIncludeStatus}
              />
            )}
          {/* Step Two: Select ValueSets */}
          {buildStep == "valueset" && queryName !== null && (
            <ValueSetSelection
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
};

export default BuildFromTemplates;
