"use client";
import React, { useState } from "react";
import { UseCaseQueryResponse } from "../query-service";
import ResultsView from "./components/resultsView/ResultsView";
import PatientSearchResults from "./components/patientSearchResults/PatientSearchResults";
import SearchForm from "./components/searchForm/SearchForm";
import SelectQuery from "./components/selectQuery/SelectQuery";
import {
  DEFAULT_DEMO_FHIR_SERVER,
  FHIR_SERVERS,
  Mode,
  USE_CASES,
} from "../constants";
import LoadingView from "./components/LoadingView";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.min.css";
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
      <div>
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
