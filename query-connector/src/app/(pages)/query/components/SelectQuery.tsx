"use client";
import React, { useEffect, useState } from "react";
import CustomizeQuery from "./CustomizeQuery";
import SelectSavedQuery from "./selectQuery/SelectSavedQuery";

import {
  PatientDiscoveryResponse,
  PatientRecordsResponse,
} from "@/app/shared/query-service";
import { Patient } from "fhir/r4";
import {
  fetchQueryResponse,
  fetchQueryValueSets,
} from "./selectQuery/queryHooks";
import LoadingView from "../../../ui/designSystem/LoadingView";
import { CustomUserQuery } from "@/app/models/entities/query";
import { DibbsValueSet } from "@/app/models/entities/valuesets";

interface SelectQueryProps {
  goForward: () => void;
  goBack: () => void;
  patientForQuery: Patient | undefined;
  patientDiscoveryResponse: PatientDiscoveryResponse | undefined;
  setResultsQueryResponse: React.Dispatch<
    React.SetStateAction<PatientRecordsResponse | undefined>
  >;
  fhirServer: string;
  setFhirServer: React.Dispatch<React.SetStateAction<string>>;
  setLoading: (isLoading: boolean) => void;
  selectedQuery: CustomUserQuery;
  setSelectedQuery: React.Dispatch<React.SetStateAction<CustomUserQuery>>;
}

/**
 * @param root0 - SelectQueryProps
 * @param root0.goBack - Callback to return to previous page
 * @param root0.goForward - Callback to go to the next page
 * @param root0.selectedQuery - query we chose for further customization
 * @param root0.setSelectedQuery - callback function to update the selected query
 * @param root0.patientForQuery - patient to apply a particular query for
 * @param root0.setResultsQueryResponse - Callback function to update selected
 * query
 * @param root0.fhirServer - the FHIR server that we're running the query against
 * @param root0.setFhirServer - callback function to update the FHIR server
 * @param root0.setLoading - callback to set the loading state
 * @returns - The selectQuery component.
 */
const SelectQuery: React.FC<SelectQueryProps> = ({
  patientForQuery,
  fhirServer,
  goForward,
  goBack,
  setResultsQueryResponse,
  setFhirServer,
  selectedQuery,
  setSelectedQuery,
  setLoading,
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
        const valueSets = await fetchQueryValueSets(queryName);
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
    goForward();
    setLoading(true);
    await fetchQueryResponse({
      queryName: selectedQuery.query_name,
      patientForQuery: patientForQuery,
      selectedQuery: selectedQuery.query_name,
      fhirServer: fhirServer,
      valueSetOverrides: queryValueSets,
      queryResponseStateCallback: setResultsQueryResponse,
      setIsLoading: setLoadingResultResponse,
    }).catch(console.error);
    setLoading(false);
  }

  const displayLoading = loadingResultResponse || loadingQueryValueSets;

  return (
    <div>
      {displayLoading && <LoadingView loading={loadingResultResponse} />}
      <SelectSavedQuery
        selectedQuery={selectedQuery}
        fhirServer={fhirServer}
        loadingQueryValueSets={loadingQueryValueSets}
        goBack={goBack}
        setSelectedQuery={setSelectedQuery}
        handleSubmit={onSubmit}
        setFhirServer={setFhirServer}
      ></SelectSavedQuery>
    </div>
  );
};

export default SelectQuery;
