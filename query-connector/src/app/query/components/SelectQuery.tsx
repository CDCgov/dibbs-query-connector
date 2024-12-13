"use client";
import React, { useEffect, useState } from "react";
import {
  FHIR_SERVERS,
  USE_CASES,
  UseCaseToQueryName,
  ValueSet,
} from "../../constants";
import CustomizeQuery from "./CustomizeQuery";
import SelectSavedQuery from "./selectQuery/SelectSavedQuery";

import { QueryResponse } from "@/app/query-service";
import { Patient } from "fhir/r4";
import {
  fetchQueryResponse,
  fetchUseCaseValueSets,
} from "./selectQuery/queryHooks";
import LoadingView from "./LoadingView";

interface SelectQueryProps {
  goForward: () => void;
  goBack: () => void;
  selectedQuery: USE_CASES;
  setSelectedQuery: React.Dispatch<React.SetStateAction<USE_CASES>>;
  patientForQuery: Patient | undefined;
  resultsQueryResponse: QueryResponse;
  setResultsQueryResponse: React.Dispatch<React.SetStateAction<QueryResponse>>;
  fhirServer: FHIR_SERVERS;
  setFhirServer: React.Dispatch<React.SetStateAction<FHIR_SERVERS>>;
  setLoading: (isLoading: boolean) => void;
  showCustomizeQuery: boolean;
  setShowCustomizeQuery: (showCustomizeQuery: boolean) => void;
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
  selectedQuery,
  patientForQuery,
  resultsQueryResponse,
  fhirServer,
  showCustomizeQuery,
  goForward,
  goBack,
  setSelectedQuery,
  setResultsQueryResponse,
  setFhirServer,
  setShowCustomizeQuery,
}) => {
  const [queryValueSets, setQueryValueSets] = useState<ValueSet[]>(
    [] as ValueSet[],
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
      if (selectedQuery) {
        const queryName = UseCaseToQueryName[selectedQuery as USE_CASES];
        const valueSets = await fetchUseCaseValueSets(queryName);
        // Only update if the fetch hasn't altered state yet
        if (isSubscribed) {
          setQueryValueSets(valueSets);
        }
      }
    };

    setLoadingQueryValueSets(true);
    fetchDataAndUpdateState().catch(console.error);
    setLoadingQueryValueSets(false);

    // Destructor hook to prevent future state updates
    return () => {
      isSubscribed = false;
    };
  }, [selectedQuery, setQueryValueSets]);

  async function onSubmit() {
    await fetchQueryResponse({
      patientForQuery: patientForQuery,
      selectedQuery: selectedQuery,
      queryValueSets: queryValueSets,
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
          useCaseQueryResponse={resultsQueryResponse}
          queryType={selectedQuery}
          queryValueSets={queryValueSets}
          setQueryValuesets={setQueryValueSets}
          goBack={() => setShowCustomizeQuery(false)}
        ></CustomizeQuery>
      ) : (
        <SelectSavedQuery
          selectedQuery={selectedQuery}
          fhirServer={fhirServer}
          loadingQueryValueSets={loadingQueryValueSets}
          goBack={goBack}
          setSelectedQuery={setSelectedQuery}
          setShowCustomizedQuery={setShowCustomizeQuery}
          handleSubmit={onSubmit}
          setFhirServer={setFhirServer}
        ></SelectSavedQuery>
      )}
    </div>
  );
};

export default SelectQuery;
