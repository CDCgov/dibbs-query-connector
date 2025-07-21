"use client";
import React, { useContext, useEffect, useState } from "react";

import ResultsView from "./components/ResultsView";
import PatientSearchResults from "./components/PatientSearchResults";
import SearchForm from "./components/searchForm/SearchForm";
import SelectQuery from "./components/SelectQuery";
import { Mode } from "@/app/shared/constants";
import StepIndicator, {
  CUSTOMIZE_QUERY_STEPS,
} from "./components/stepIndicator/StepIndicator";
import { DataContext } from "@/app/shared/DataProvider";
import { Patient } from "fhir/r4";
import { CustomUserQuery } from "@/app/models/entities/query";
import WithAuth from "@/app/ui/components/withAuth/WithAuth";
import {
  PatientDiscoveryResponse,
  PatientRecordsResponse,
} from "@/app/backend/query-execution";
import {
  getFhirServerNames,
  getFhirServerConfigs,
} from "@/app/backend/fhir-servers";
import { FhirServerConfig } from "@/app/models/entities/fhir-servers";

const blankUserQuery = {
  queryId: "",
  queryName: "",
  conditionsList: [],
  valuesets: [],
};

const Query: React.FC = () => {
  const [selectedQuery, setSelectedQuery] = useState<CustomUserQuery>(
    structuredClone(blankUserQuery),
  );
  const [mode, setMode] = useState<Mode>("search");
  const [loading, setLoading] = useState<boolean>(false);
  const [fhirServer, setFhirServer] = useState<string>("");
  const [fhirServers, setFhirServers] = useState<string[]>([]);
  const [fhirServerConfigs, setFhirServerConfigs] = useState<
    FhirServerConfig[]
  >([]);
  const ctx = useContext(DataContext);

  async function fetchFHIRServerData() {
    const names = await getFhirServerNames();
    const configs = await getFhirServerConfigs();
    setFhirServers(names);
    setFhirServer(names[0]);
    setFhirServerConfigs(configs);
  }

  useEffect(() => {
    fetchFHIRServerData();
  }, []);

  // update the current page details when switching between modes,
  // so the SiteAlert displays the correct content
  useEffect(() => {
    ctx?.setCurrentPage(mode);
  }, [mode]);

  const [patientDiscoveryQueryResponse, setPatientDiscoveryQueryResponse] =
    useState<PatientDiscoveryResponse>();
  const [patientForQuery, setPatientForQueryResponse] = useState<Patient>();
  const [resultsQueryResponse, setResultsQueryResponse] =
    useState<PatientRecordsResponse>();

  const modeToCssContainerMap: { [mode in Mode]: string } = {
    search: "main-container",
    "patient-results": "main-container__wide",
    "select-query": "main-container",
    results: "main-container__wide",
  };

  return (
    <WithAuth>
      {Object.keys(CUSTOMIZE_QUERY_STEPS).includes(mode) && (
        <StepIndicator
          headingLevel="h4"
          className="stepper-container"
          curStep={mode}
        />
      )}
      <div className={modeToCssContainerMap[mode]}>
        {/* Step 1 */}
        {mode === "search" && (
          <SearchForm
            setMode={setMode}
            setLoading={setLoading}
            setPatientDiscoveryQueryResponse={setPatientDiscoveryQueryResponse}
            fhirServers={fhirServers}
            selectedFhirServer={fhirServer}
            setFhirServer={setFhirServer}
            fhirServerConfigs={fhirServerConfigs}
          />
        )}

        {/* Step 2 */}
        {mode === "patient-results" && (
          <PatientSearchResults
            patients={patientDiscoveryQueryResponse ?? []}
            goBack={() => {
              setMode("search");
            }}
            setMode={setMode}
            setPatientForQueryResponse={setPatientForQueryResponse}
            loading={loading}
          />
        )}

        {/* Step 3 */}
        {mode === "select-query" && selectedQuery && (
          <SelectQuery
            goBack={() => {
              setMode("patient-results");
            }}
            goForward={() => setMode("results")}
            patientForQuery={patientForQuery}
            patientDiscoveryResponse={patientDiscoveryQueryResponse}
            setResultsQueryResponse={setResultsQueryResponse}
            fhirServer={fhirServer}
            setFhirServer={setFhirServer}
            setLoading={setLoading}
            selectedQuery={selectedQuery}
            setSelectedQuery={setSelectedQuery}
          />
        )}

        {/* Step 4 */}
        {mode === "results" && (
          <ResultsView
            selectedQuery={selectedQuery}
            patientRecordsResponse={resultsQueryResponse}
            goBack={() => {
              setMode("select-query");
            }}
            goToBeginning={() => {
              setMode("search");
            }}
            loading={loading}
          />
        )}
      </div>
    </WithAuth>
  );
};

export default Query;
