"use client";

import Backlink from "@/app/query/components/backLink/Backlink";
import styles from "../conditionTemplateSelection/conditionTemplateSelection.module.scss";
import { Label, TextInput, Button } from "@trussworks/react-uswds";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import {
  getConditionsData,
  getValueSetsAndConceptsByConditionIDs,
} from "@/app/database-service";
import {
  ConditionIdToValueSetArrayMap,
  NestedQuery,
  EMPTY_QUERY_SELECTION,
  CategoryToConditionArrayMap,
  ConditionIdToDetailsMap,
} from "../utils";
import { ConditionSelection } from "../components/ConditionSelection";
import { ValueSetSelection } from "../components/ValueSetSelection";
import SiteAlert from "@/app/query/designSystem/SiteAlert";
import { BuildStep, DibbsConceptType, DibbsValueSet } from "../../constants";
import LoadingView from "../../query/components/LoadingView";
import classNames from "classnames";
import { groupConditionConceptsIntoValueSets } from "@/app/utils";
import { SelectedQueryDetails } from "../querySelection/utils";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getSavedQueryDetails,
  saveCustomQuery,
} from "@/app/backend/query-building";
import {
  VsGrouping,
  generateValueSetGroupingsByDibbsConceptType,
} from "@/app/utils/valueSetTranslation";

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
  const [queryName, setQueryName] = useState<string | undefined>(
    selectedQuery.queryName,
  );
  const [categoryToConditionMap, setCategoryToConditionMap] =
    useState<CategoryToConditionArrayMap>();
  const [conditionIdToDetailsMap, setConditionsDetailsMap] =
    useState<ConditionIdToDetailsMap>();

  const [formError, setFormError] = useState<FormError>({
    queryName: false,
    selectedConditions: false,
  });

  const [constructedQuery, setConstructedQuery] = useState<NestedQuery>({});

  function goBack() {
    setQueryName(undefined);
    setSelectedQuery(EMPTY_QUERY_SELECTION);
    setBuildStep("selection");
  }

  useEffect(() => {
    let isSubscribed = true;

    if (queryName == "" || queryName == undefined) {
      focusRef?.current?.focus();
    }

    if (Object.keys(constructedQuery).length < 1) {
      setFormError({ ...formError, ...{ selectedConditions: true } });
    } else {
      setFormError({ ...formError, ...{ selectedConditions: false } });
    }

    // clear the error when the user enters a query name
    if (formError.queryName && !!queryName) {
      validateForm();
    }

    async function fetchInitialConditions() {
      const { categoryToConditionNameArrayMap, conditionIdToNameMap } =
        await getConditionsData();

      if (isSubscribed) {
        setConditionsDetailsMap(conditionIdToNameMap);
        setCategoryToConditionMap(categoryToConditionNameArrayMap);
      }
    }

    fetchInitialConditions().catch(console.error);

    return () => {
      isSubscribed = false;
    };
  }, [queryName]);

  useEffect(() => {
    let isSubscribed = true;

    async function setInitialQueryState() {
      if (
        selectedQuery.queryId === undefined ||
        categoryToConditionMap === undefined
      ) {
        return;
      }
      const result = await getSavedQueryDetails(selectedQuery.queryId);

      if (result === undefined) {
        return;
      }
      const savedQuery = result[0];

      // TODO: this is bad and should be refactored once we get rid of VsGrouping
      Object.entries(savedQuery.query_data).forEach(
        ([conditionId, valueSetMap]) => {
          const typeLevelUpdate = handleQueryUpdate(conditionId);

          Object.entries(valueSetMap).forEach(
            ([vsNameAuthorSystem, dibbsVs]) => {
              const valueSetLevelUpdate = typeLevelUpdate(
                dibbsVs.dibbsConceptType,
              );
              const vsGroupingUpdate = valueSetLevelUpdate(vsNameAuthorSystem);
              const vsUpdate = vsGroupingUpdate({
                valueSetName: vsNameAuthorSystem,
                author: dibbsVs.author,
                system: dibbsVs.system,
                items: [dibbsVs],
              });

              vsUpdate([dibbsVs]);
            },
          );
        },
      );
    }
    setInitialQueryState().catch(console.error);
    setFormError({
      queryName: false,
      selectedConditions: false,
    });
    return () => {
      isSubscribed = false;
    };
  }, [categoryToConditionMap]);

  async function handleCreateQueryClick(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    setLoading(true);
    validateForm();
    if (!!queryName && !formError.queryName && !formError.selectedConditions) {
      // fetch valuesets for selected conditions
      const conditionIdsToFetch = Object.keys(constructedQuery);
      const valueSets =
        await getValueSetsForSelectedConditions(conditionIdsToFetch);

      setBuildStep("valueset");
      setLoading(false);
    }
  }

  const validateForm = () => {
    if (!queryName || queryName == "") {
      focusRef?.current?.focus();
    }
    const atLeastOneItemSelected = Object.keys(constructedQuery).length > 0;

    return setFormError({
      ...formError,
      ...{ queryName: !queryName, selectedConditions: !atLeastOneItemSelected },
    });
  };

  async function handleConditionUpdate(conditionId: string, remove: boolean) {
    const conditionValueSets = await getValueSetsForSelectedConditions([
      conditionId,
    ]);

    // TODO: error handle this better
    if (conditionValueSets === undefined) return;

    if (remove) {
      setConstructedQuery((prevState) => {
        delete prevState[conditionId];

        if (Object.keys(prevState).length === 0) {
          setFormError((prevError) => {
            return { ...prevError, selectedConditions: true };
          });
        }

        return structuredClone(prevState);
      });
    } else {
      const valueSetsToAdd = conditionValueSets[conditionId];
      // TODO: unnest this once we refactor out VSGrouping
      const vsGroupingMap =
        generateValueSetGroupingsByDibbsConceptType(valueSetsToAdd);

      Object.entries(vsGroupingMap).forEach(([vsType, vsGroupingMap]) => {
        const vsGrouping = Object.entries(vsGroupingMap)[0];
        const vsName = vsGrouping[0];
        const vsGroup = vsGrouping[1];

        handleQueryUpdate(conditionId)(vsType as DibbsConceptType)(vsName)(
          vsGroup,
        )(vsGroup.items);

        setFormError((prevError) => {
          return { ...prevError, selectedConditions: false };
        });
      });
    }
  }

  const handleQueryUpdate =
    (conditionId: string) =>
    (vsType: DibbsConceptType) =>
    (vsName: string) =>
    (vsGrouping: VsGrouping) =>
    (dibbsValueSets: DibbsValueSet[]) => {
      setConstructedQuery((prevState) => {
        prevState[conditionId] = prevState[conditionId] ?? {};
        prevState[conditionId][vsType] = prevState[conditionId][vsType] ?? {};
        prevState[conditionId][vsType][vsName] =
          prevState[conditionId][vsType][vsName] ?? {};

        prevState[conditionId][vsType][vsName] = {
          ...vsGrouping,
          items: [
            { ...dibbsValueSets[0], concepts: dibbsValueSets[0].concepts },
          ],
        };

        return structuredClone(prevState);
      });
    };

  async function handleSaveQuery() {
    if (constructedQuery && queryName) {
      // TODO: get this from the auth session
      const userName = "DIBBS";
      const result = await saveCustomQuery(
        constructedQuery,
        queryName,
        userName,
        selectedQuery.queryId,
      );
    }
  }

  return (
    <>
      <SiteAlert />
      <div className={classNames("main-container__wide", styles.mainContainer)}>
        <Backlink
          onClick={() => {
            // TODO: this can be tidied up...
            if (buildStep == "valueset") {
              setBuildStep("condition");
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
                title={
                  buildStep == "valueset"
                    ? "Save query"
                    : formError.selectedConditions || formError.queryName
                      ? "Enter a query name and condition"
                      : "Click to create your query"
                }
                disabled={
                  formError.selectedConditions ||
                  !queryName ||
                  loading ||
                  buildStep == "valueset" // hard-coding this off for now; should be handled in concept selection ticket
                }
                onClick={
                  buildStep == "condition"
                    ? handleCreateQueryClick
                    : handleSaveQuery
                }
              >
                {buildStep == "condition" ? "Customize query" : "Save query"}
              </Button>
            </div>
          </div>
        </div>
        <div className="display-flex flex-auto">
          {/* Step One: Select Conditions */}
          {buildStep == "condition" && categoryToConditionMap && (
            <ConditionSelection
              queryName={queryName}
              fetchedConditions={categoryToConditionMap}
              setFormError={setFormError}
              formError={formError}
              validateForm={validateForm}
              loading={loading}
              setLoading={setLoading}
              constructedQuery={constructedQuery}
              handleConditionUpdate={handleConditionUpdate}
            />
          )}
          {/* Step Two: Select ValueSets */}
          {buildStep == "valueset" &&
            categoryToConditionMap &&
            conditionIdToDetailsMap && (
              <ValueSetSelection
                categoryToConditionsMap={categoryToConditionMap}
                conditionsDetailsMap={conditionIdToDetailsMap}
                constructedQuery={constructedQuery}
                handleSelectedValueSetUpdate={handleQueryUpdate}
                handleUpdateCondition={handleConditionUpdate}
              />
            )}
        </div>
        {loading && <LoadingView loading={loading} />}
      </div>
    </>
  );
};

export default BuildFromTemplates;

async function getValueSetsForSelectedConditions(conditionIds: string[]) {
  const conditionValueSets: ConditionIdToValueSetArrayMap = {};

  // if there are new ids, we need to query the db
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
  }, conditionValueSets);

  return conditionValueSets;
}
