"use client";
import React, { useState } from "react";
import { UseCaseQueryResponse } from "../query-service";
import ResultsView from "./components/ResultsView";
import PatientSearchResults from "./components/PatientSearchResults";
import SearchForm from "./components/SearchForm";
import SelectQuery from "./SelectQuery";
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
} from "./stepIndicator/StepIndicator";
import SiteAlert from "./designSystem/SiteAlert";
import { Patient } from "fhir/r4";

/**
 * Parent component for the query page. Based on the mode, it will display the search
 * form, the results of the query, or the multiple patients view.
 * @returns - The Query component.
 */
const Query: React.FC = () => {
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
  return (
    <>
      <SiteAlert page={mode} />
      {Object.keys(CUSTOMIZE_QUERY_STEPS).includes(mode) && (
        <StepIndicator headingLevel="h4" curStep={mode} />
      )}
      <div className="main-container">
        {/* Step 1 */}
        {mode === "search" && (
          <div className="main-container">
            <SearchForm
              useCase={useCase}
              setUseCase={setUseCase}
              setMode={setMode}
              setLoading={setLoading}
              setPatientDiscoveryQueryResponse={
                setPatientDiscoveryQueryResponse
              }
              fhirServer={fhirServer}
              setFhirServer={setFhirServer}
            />
          </div>
        )}

        {/* Step 2 */}
        {mode === "patient-results" && (
          <div className="main-container__wide">
            <PatientSearchResults
              patients={patientDiscoveryQueryResponse?.Patient ?? []}
              goBack={() => setMode("search")}
              setMode={setMode}
              setPatientForQueryResponse={setPatientForQueryResponse}
            />
          </div>
        )}

        {/* Step 3 */}
        {mode === "select-query" && (
          <div
            className={
              showCustomizeQuery ? "main-container__wide" : "main-container"
            }
          >
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
          </div>
        )}

        {/* Step 4 */}
        {mode === "results" && (
          <div className="main-container__wide">
            {resultsQueryResponse && (
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
          </div>
        )}
        {loading && <LoadingView loading={loading} />}

        <ToastContainer icon={false} />
      </div>
    </>
  );
};

export default Query;
