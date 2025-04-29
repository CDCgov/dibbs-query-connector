"use client";
import React, { useState } from "react";
import SelectSavedQuery from "./selectQuery/SelectSavedQuery";

import {
  PatientDiscoveryResponse,
  patientRecordsQuery,
  PatientRecordsResponse,
} from "@/app/shared/query-service";
import { CustomUserQuery } from "@/app/models/entities/query";
import { Patient } from "fhir/r4";

import LoadingView from "../../../ui/designSystem/LoadingView";
import { hyperUnluckyPatient } from "../../../shared/constants";

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
  const [loadingResultResponse, setLoadingResultResponse] =
    useState<boolean>(false);

  async function fetchQueryResponse(
    queryName: string,
    patientForQuery: Patient | undefined,
    fhirServer: string,
  ) {
    if (patientForQuery) {
      const newRequest = {
        queryName: queryName,
        patientId: patientForQuery.id ?? hyperUnluckyPatient.Id,
        fhirServer: fhirServer,
      };
      setLoadingResultResponse(true);
      const queryResponse = await patientRecordsQuery(newRequest);

      setResultsQueryResponse({
        Patient: [patientForQuery],
        ...queryResponse,
      });
      setLoadingResultResponse(false);
    }
  }

  async function onSubmit() {
    goForward();
    setLoading(true);
    await fetchQueryResponse(
      selectedQuery.query_name,
      patientForQuery,
      fhirServer,
    ).catch(console.error);
    setLoading(false);
  }

  const displayLoading = loadingResultResponse;

  return (
    <div>
      {displayLoading && <LoadingView loading={loadingResultResponse} />}
      <SelectSavedQuery
        selectedQuery={selectedQuery}
        fhirServer={fhirServer}
        goBack={goBack}
        setSelectedQuery={setSelectedQuery}
        handleSubmit={onSubmit}
        setFhirServer={setFhirServer}
      ></SelectSavedQuery>
    </div>
  );
};

export default SelectQuery;
