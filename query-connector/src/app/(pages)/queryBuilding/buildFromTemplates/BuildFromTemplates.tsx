"use client";

import Backlink from "@/app/ui/designSystem/backLink/Backlink";
import styles from "./conditionTemplateSelection.module.scss";
import { Label, TextInput, Button } from "@trussworks/react-uswds";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getConditionsData,
  getValueSetsAndConceptsByConditionIDs,
} from "@/app/shared/database-service";
import {
  ConditionIdToValueSetArrayMap,
  NestedQuery,
  CategoryToConditionArrayMap,
  ConditionsMap,
  EMPTY_CONCEPT_TYPE,
} from "../utils";
import { ConditionSelection } from "../components/ConditionSelection";
import { ValueSetSelection } from "../components/ValueSetSelection";
import { BuildStep } from "../../../shared/constants";
import LoadingView from "../../../ui/designSystem/LoadingView";
import classNames from "classnames";
import { groupConditionConceptsIntoValueSets } from "@/app/shared/utils";
import { SelectedQueryDetails } from "../querySelection/utils";

import { getCustomQueries } from "@/app/backend/query-building";
import { groupValueSetsByConceptType } from "@/app/utils/valueSetTranslation";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { DataContext } from "@/app/shared/DataProvider";
import {
  DibbsConceptType,
  DibbsValueSet,
} from "@/app/models/entities/valuesets";
import {
  getSavedQueryById,
  saveCustomQuery,
} from "@/app/backend/dbServices/query-building";

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
    useState<ConditionsMap>();

  const [formError, setFormError] = useState<FormError>({
    queryName: false,
    selectedConditions: false,
  });

  const [constructedQuery, setConstructedQuery] = useState<NestedQuery>({});

  function resetQueryState() {
    setQueryName(undefined);
    setSelectedQuery({
      queryId: undefined,
      queryName: undefined,
    });
    setConstructedQuery({});
  }

  function goBack() {
    resetQueryState();
    setBuildStep("selection");
  }

  useEffect(() => {
    if (queryName == "" || queryName == undefined) {
      focusRef?.current?.focus();
    }

    validateForm();
  }, [queryName]);

  useEffect(() => {
    let isSubscribed = true;

    async function setInitialQueryState() {
      if (selectedQuery.queryId === undefined) {
        return;
      }
      const savedQuery = await getSavedQueryById(selectedQuery.queryId);
      if (savedQuery === undefined) {
        return;
      }
      const initialState: NestedQuery = {};

      Object.entries(savedQuery.query_data).forEach(
        ([conditionId, valueSetMap]) => {
          initialState[conditionId] = structuredClone(EMPTY_CONCEPT_TYPE);

          Object.entries(valueSetMap).forEach(([vsId, dibbsVs]) => {
            initialState[conditionId][dibbsVs.dibbsConceptType][vsId] = dibbsVs;
          });
        },
      );

      if (isSubscribed) {
        setConstructedQuery(initialState);
      }

      setFormError((prevError) => {
        return { ...prevError, selectedConditions: false };
      });
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
    setInitialQueryState().catch(console.error);

    return () => {
      isSubscribed = false;
    };
  }, []);

  async function handleCreateQueryClick(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    setLoading(true);
    validateForm();
    if (!!queryName && !formError.queryName && !formError.selectedConditions) {
      const conditionIdsToFetch = Object.keys(constructedQuery);
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

      return;
    } else {
      const conditionValueSets = await getValueSetsForSelectedConditions([
        conditionId,
      ]);

      if (
        conditionValueSets === undefined ||
        conditionValueSets[conditionId] === undefined
      ) {
        showToastConfirmation({
          heading: "Something went wrong",
          body: "Couldn't fetch condition value sets. Try again, or contact us if the error persists",
          variant: "error",
        });
        return;
      }
      const valueSetsToAdd = conditionValueSets[conditionId];
      const valueSetsByConceptType =
        groupValueSetsByConceptType(valueSetsToAdd);

      Object.entries(valueSetsByConceptType).forEach(([vsType, dibbsVsArr]) => {
        const typeLevelUpdate = handleQueryUpdate(conditionId)(
          vsType as DibbsConceptType,
        );

        dibbsVsArr.forEach((dibbsVs) => {
          typeLevelUpdate(dibbsVs.valueSetId)(dibbsVs);
        });
        setFormError((prevError) => {
          return { ...prevError, selectedConditions: false };
        });
      });
    }
  }

  const handleQueryUpdate =
    (conditionId: string) =>
    (vsType: DibbsConceptType) =>
    (vsId: string) =>
    (dibbsValueSet: DibbsValueSet) => {
      setConstructedQuery((prevState) => {
        prevState[conditionId] = prevState[conditionId] ?? {};
        prevState[conditionId][vsType] = prevState[conditionId][vsType] ?? {};
        prevState[conditionId][vsType][vsId] = dibbsValueSet;
        return structuredClone(prevState);
      });
    };

  const queriesContext = useContext(DataContext);

  async function handleSaveQuery() {
    if (constructedQuery && queryName) {
      // TODO: get this from the auth session
      const userName = "DIBBS";
      try {
        const results = await saveCustomQuery(
          constructedQuery,
          queryName,
          userName,
          selectedQuery.queryId,
        );

        if (results === undefined) {
          throw "Result status not returned";
        }

        const queries = await getCustomQueries();
        queriesContext?.setData(queries);
        const statusMessage =
          results[0].operation === "INSERT" ? "created" : "updated";

        showToastConfirmation({
          body: `${queryName} successfully ${statusMessage}`,
        });
      } catch {
        showToastConfirmation({
          heading: "Something went wrong",
          body: `${queryName} wasn't successfully created. Please try again or contact us if the error persists`,
          variant: "error",
        });
      }
    }
  }

  return (
    <>
      <div className={classNames("main-container__wide", styles.mainContainer)}>
        {buildStep === "valueset" ? (
          <Backlink
            onClick={() => {
              setBuildStep("condition");
            }}
            label={"Back to condition selection"}
          />
        ) : (
          <Backlink onClick={goBack} label={"Back to My queries"} />
        )}

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
                className="width-mobile"
                defaultValue={queryName ?? ""}
                required
                onChange={(event) => {
                  setQueryName(event.target.value);
                }}
                data-testid="queryNameInput"
              />
            </div>
            <div className={styles.customQuery__saveButton}>
              <Button
                className="margin-0"
                type={"button"}
                title={
                  buildStep === "valueset"
                    ? "Save query"
                    : formError.selectedConditions || formError.queryName
                      ? "Enter a query name and condition"
                      : "Click to create your query"
                }
                disabled={formError.selectedConditions || !queryName || loading}
                onClick={
                  buildStep === "condition"
                    ? handleCreateQueryClick
                    : handleSaveQuery
                }
                data-testid="createSaveQueryBtn"
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
              categoryToConditionsMap={categoryToConditionMap}
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
                conditionsMap={conditionIdToDetailsMap}
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

  if (conditionIds.length === 0) {
    return {};
  }
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
}
