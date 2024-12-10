"use client";
import React, { useState } from "react";
import { UseCaseQueryResponse } from "../query-service";
import ResultsView from "./components/ResultsView";
import PatientSearchResults from "./components/PatientSearchResults";
import SearchForm from "./components/SearchForm";
import SelectQuery from "./components/SelectQuery";
import {
  DEFAULT_DEMO_FHIR_SERVER,
  FHIR_SERVERS,
  Mode,
  USE_CASES,
} from "../constants";
import LoadingView from "./components/LoadingView";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.min.css";
import StepIndicator, {
  CUSTOMIZE_QUERY_STEPS,
} from "./components/stepIndicator/StepIndicator";
import SiteAlert from "./designSystem/SiteAlert";
import { Patient } from "fhir/r4";

/**
 * Client side parent component for the query page. Based on the mode, it will display the search
 * form, the results of the query, or the multiple patients view.
 * @param root0.fhirServers - The list of FHIR servers to query against from the DB and harded coded (for now).
 * @param root0
 * @returns - The Query component.
 */
const QueryClient: React.FC<{ fhirServers: string[] }> = ({ fhirServers }) => {
  const [useCase, setUseCase] = useState<USE_CASES>("" as USE_CASES);
  const [mode, setMode] = useState<Mode>("search");
  const [loading, setLoading] = useState<boolean>(false);
  const [fhirServer, setFhirServer] = useState<FHIR_SERVERS>(
    DEFAULT_DEMO_FHIR_SERVER,
  );

  const [patientDiscoveryQueryResponse, setPatientDiscoveryQueryResponse] =
    useState<UseCaseQueryResponse>({});
  const [patientForQuery, setPatientForQueryResponse] = useState<Patient>();
  const [resultsQueryResponse, setResultsQueryResponse] =
    useState<UseCaseQueryResponse>({});

  const [showCustomizeQuery, setShowCustomizeQuery] = useState(false);

  const modeToCssContainerMap: { [mode in Mode]: string } = {
    search: "main-container",
    "patient-results": "main-container__wide",
    "select-query": showCustomizeQuery
      ? "main-container__wide"
      : "main-container",
    results: "main-container__wide",
  };
  return (
    <>
      <SiteAlert page={mode} />
      <div className={modeToCssContainerMap[mode]}>
        {Object.keys(CUSTOMIZE_QUERY_STEPS).includes(mode) &&
          !showCustomizeQuery && (
            <StepIndicator headingLevel="h4" curStep={mode} />
          )}
        {/* Step 1 */}
        {mode === "search" && (
          <SearchForm
            useCase={useCase}
            setUseCase={setUseCase}
            setMode={setMode}
            setLoading={setLoading}
            setPatientDiscoveryQueryResponse={setPatientDiscoveryQueryResponse}
            fhirServers={fhirServers}
            selectedFhirServer={fhirServer}
            setFhirServer={setFhirServer}
          />
        )}

        {/* Step 2 */}
        {mode === "patient-results" && (
          <PatientSearchResults
            patients={patientDiscoveryQueryResponse?.Patient ?? []}
            goBack={() => setMode("search")}
            setMode={setMode}
            setPatientForQueryResponse={setPatientForQueryResponse}
          />
        )}

        {/* Step 3 */}
        {mode === "select-query" && (
          <SelectQuery
            goBack={() => setMode("patient-results")}
            goForward={() => setMode("results")}
            selectedQuery={useCase}
            setSelectedQuery={setUseCase}
            patientForQuery={patientForQuery}
            resultsQueryResponse={resultsQueryResponse}
            showCustomizeQuery={showCustomizeQuery}
            setResultsQueryResponse={setResultsQueryResponse}
            setShowCustomizeQuery={setShowCustomizeQuery}
            fhirServer={fhirServer}
            setFhirServer={setFhirServer}
            setLoading={setLoading}
          />
        )}

        {/* Step 4 */}
        {mode === "results" && resultsQueryResponse && (
          <ResultsView
            selectedQuery={useCase}
            useCaseQueryResponse={resultsQueryResponse}
            goBack={() => {
              setMode("select-query");
            }}
            goToBeginning={() => {
              setMode("search");
            }}
          />
        )}
        {loading && <LoadingView loading={loading} />}
        <ToastContainer icon={false} />
      </div>
    </>
  );
};

export default QueryClient;
