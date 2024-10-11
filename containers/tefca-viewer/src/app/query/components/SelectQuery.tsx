"use client";
import React, { useEffect, useState } from "react";
import { FHIR_SERVERS, USE_CASES, ValueSetItem } from "../../constants";
import CustomizeQuery from "./CustomizeQuery";
import SelectSavedQuery from "./selectQuery/SelectSavedQuery";

import { QueryResponse } from "@/app/query-service";
import { Patient } from "fhir/r4";
import {
  fetchQueryResponse,
  fetchUseCaseValueSets,
} from "./selectQuery/queryHooks";

interface SelectQueryProps {
  onSubmit: () => void; // Callback when the user submits the query
  goBack: () => void;
  selectedQuery: USE_CASES;
  setSelectedQuery: React.Dispatch<React.SetStateAction<USE_CASES>>;
  patientForQuery: Patient | undefined;
  resultsQueryResponse: QueryResponse;
  setResultsQueryResponse: React.Dispatch<React.SetStateAction<QueryResponse>>;
  fhirServer: FHIR_SERVERS;
  setFhirServer: React.Dispatch<React.SetStateAction<FHIR_SERVERS>>;
}

/**
 * @param root0 - SelectQueryProps
 * @param root0.onSubmit - Callback for submit action
 * @param root0.goBack - Callback to return to previous page
 * @param root0.selectedQuery - query we chose for further customization
 * @param root0.setSelectedQuery - callback function to update the selected query
 * @param root0.patientForQuery - patient to apply a particular query for
 * @param root0.resultsQueryResponse - Response of selected query
 * @param root0.setResultsQueryResponse - Callback function to update selected
 * query
 * @param root0.fhirServer - the FHIR server that we're running the query against
 * @param root0.setFhirServer - callback function to update the FHIR server
 * @returns - The selectQuery component.
 */
const SelectQuery: React.FC<SelectQueryProps> = ({
  onSubmit,
  goBack,
  selectedQuery,
  setSelectedQuery,
  patientForQuery,
  resultsQueryResponse,
  setResultsQueryResponse,
  fhirServer,
  setFhirServer,
}) => {
  const [showCustomizeQuery, setShowCustomizedQuery] = useState(false);
  const [queryValueSets, setQueryValueSets] = useState<ValueSetItem[]>(
    [] as ValueSetItem[],
  );
  useEffect(() => {
    // Gate whether we actually update state after fetching so we
    // avoid name-change race conditions
    let isSubscribed = true;

    fetchUseCaseValueSets(selectedQuery, setQueryValueSets, isSubscribed).catch(
      console.error,
    );

    // Destructor hook to prevent future state updates
    return () => {
      isSubscribed = false;
    };
  }, [selectedQuery, setQueryValueSets]);

  useEffect(() => {
    let isSubscribed = true;

    fetchQueryResponse(
      patientForQuery,
      selectedQuery,
      isSubscribed,
      queryValueSets,
      setResultsQueryResponse,
      fhirServer,
    ).catch(console.error);

    // Destructor hook to prevent future state updates
    return () => {
      isSubscribed = false;
    };
  }, [patientForQuery, selectedQuery, queryValueSets, setResultsQueryResponse]);

  return showCustomizeQuery ? (
    <CustomizeQuery
      useCaseQueryResponse={resultsQueryResponse}
      queryType={selectedQuery}
      queryValuesets={queryValueSets}
      setQueryValuesets={setQueryValueSets}
      goBack={() => setShowCustomizedQuery(false)}
    ></CustomizeQuery>
  ) : (
    <SelectSavedQuery
      goBack={goBack}
      selectedQuery={selectedQuery}
      setSelectedQuery={setSelectedQuery}
      setShowCustomizedQuery={setShowCustomizedQuery}
      handleSubmit={onSubmit}
      fhirServer={fhirServer}
      setFhirServer={setFhirServer}
    ></SelectSavedQuery>
  );
};

export default SelectQuery;
export const RETURN_TO_STEP_ONE_LABEL = "Return to Select patient";
