"use client";
import React, { useEffect, useState } from "react";
import { DibbsValueSet } from "../../constants";
import CustomizeQuery from "./CustomizeQuery";
import SelectSavedQuery from "./selectQuery/SelectSavedQuery";

import { QueryResponse } from "@/app/query-service";
import { Patient } from "fhir/r4";
import {
  fetchQueryResponse,
  fetchUseCaseValueSets,
} from "./selectQuery/queryHooks";
import LoadingView from "./LoadingView";
import { CustomUserQuery } from "@/app/query-building";

interface SelectQueryProps {
  goForward: () => void;
  goBack: () => void;
  patientForQuery: Patient | undefined;
  resultsQueryResponse: QueryResponse;
  setResultsQueryResponse: React.Dispatch<React.SetStateAction<QueryResponse>>;
  fhirServer: string;
  setFhirServer: React.Dispatch<React.SetStateAction<string>>;
  setLoading: (isLoading: boolean) => void;
  showCustomizeQuery: boolean;
  setShowCustomizeQuery: (showCustomizeQuery: boolean) => void;
  selectedQuery: CustomUserQuery;
  setSelectedQuery: React.Dispatch<React.SetStateAction<CustomUserQuery>>;
}

/**
 * @param root0 - SelectQueryProps
 * @param root0.goBack - Callback to return to previous page
 * @param root0.goForward - Callback to go to the next page
 * @param root0.selectedQuery - query we chose for further customization
 * @param root0.showCustomizeQuery - toggle to navigate to show customize query
 * @param root0.setSelectedQuery - callback function to update the selected query
 * @param root0.patientForQuery - patient to apply a particular query for
 * @param root0.resultsQueryResponse - Response of selected query
 * @param root0.setResultsQueryResponse - Callback function to update selected
 * query
 * @param root0.setShowCustomizeQuery - state function to update location of
 * show customize query
 * @param root0.fhirServer - the FHIR server that we're running the query against
 * @param root0.setFhirServer - callback function to update the FHIR server
 * @returns - The selectQuery component.
 */
const SelectQuery: React.FC<SelectQueryProps> = ({
  patientForQuery,
  resultsQueryResponse,
  fhirServer,
  showCustomizeQuery,
  goForward,
  goBack,
  setResultsQueryResponse,
  setFhirServer,
  setShowCustomizeQuery,
  selectedQuery,
  setSelectedQuery,
}) => {
  const [queryValueSets, setQueryValueSets] = useState<DibbsValueSet[]>(
    [] as DibbsValueSet[],
  );
  const [loadingQueryValueSets, setLoadingQueryValueSets] =
    useState<boolean>(true);

  const [loadingResultResponse, setLoadingResultResponse] =
    useState<boolean>(false);

  useEffect(() => {
    // Gate whether we actually update state after fetching so we
    // avoid name-change race conditions
    let isSubscribed = true;

    const fetchDataAndUpdateState = async () => {
      setLoadingQueryValueSets(true);
      if (selectedQuery && selectedQuery.query_name) {
        const queryName = selectedQuery.query_name;
        const valueSets = await fetchUseCaseValueSets(queryName);
        // Only update if the fetch hasn't altered state yet
        if (isSubscribed) {
          setQueryValueSets(valueSets);
        }
      }
      setLoadingQueryValueSets(false);
    };

    fetchDataAndUpdateState().catch(console.error);

    // Destructor hook to prevent future state updates
    return () => {
      isSubscribed = false;
    };
  }, [selectedQuery]);

  async function onSubmit() {
    await fetchQueryResponse({
      queryName: selectedQuery.query_name,
      patientForQuery: patientForQuery,
      selectedQuery: selectedQuery.query_name,
      fhirServer: fhirServer,
      queryResponseStateCallback: setResultsQueryResponse,
      setIsLoading: setLoadingResultResponse,
    }).catch(console.error);
    goForward();
  }

  const displayLoading = loadingResultResponse || loadingQueryValueSets;

  return (
    <div>
      {displayLoading && <LoadingView loading={loadingResultResponse} />}

      {showCustomizeQuery ? (
        <CustomizeQuery
          selectedQuery={selectedQuery}
          useCaseQueryResponse={resultsQueryResponse}
          queryValueSets={queryValueSets}
          setQueryValuesets={setQueryValueSets}
          goBack={() => setShowCustomizeQuery(false)}
        ></CustomizeQuery>
      ) : (
        <SelectSavedQuery
          selectedQuery={selectedQuery}
          setSelectedQuery={setSelectedQuery}
          fhirServer={fhirServer}
          loadingQueryValueSets={loadingQueryValueSets}
          goBack={goBack}
          setShowCustomizedQuery={setShowCustomizeQuery}
          handleSubmit={onSubmit}
          setFhirServer={setFhirServer}
        ></SelectSavedQuery>
      )}
    </div>
  );
};

export default SelectQuery;
