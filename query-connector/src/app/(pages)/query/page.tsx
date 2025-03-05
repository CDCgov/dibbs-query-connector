"use client";
import React, { useContext, useEffect, useState } from "react";
import { FhirQueryResponse } from "../../shared/query-service";
import ResultsView from "./components/ResultsView";
import PatientSearchResults from "./components/PatientSearchResults";
import SearchForm from "./components/searchForm/SearchForm";
import SelectQuery from "./components/SelectQuery";
import { DEFAULT_DEMO_FHIR_SERVER, Mode } from "../../shared/constants";
import StepIndicator, {
  CUSTOMIZE_QUERY_STEPS,
} from "./components/stepIndicator/StepIndicator";
import { DataContext } from "@/app/shared/DataProvider";
import { Patient } from "fhir/r4";
import { getFhirServerNames } from "@/app/backend/fhir-servers";
import { CustomUserQuery } from "@/app/models/entities/query";

const blankUserQuery = {
  query_id: "",
  query_name: "",
  conditions_list: [],
  valuesets: [],
};
/**
 * Client side parent component for the query page. Based on the mode, it will display the search
 * form, the results of the query, or the multiple patients view.
 * @returns - The Query component.
 */
const Query: React.FC = () => {
  const [selectedQuery, setSelectedQuery] = useState<CustomUserQuery>(
    structuredClone(blankUserQuery),
  );
  const [mode, setMode] = useState<Mode>("search");
  const [loading, setLoading] = useState<boolean>(false);
  const [fhirServer, setFhirServer] = useState<string>(
    DEFAULT_DEMO_FHIR_SERVER,
  );
  const [fhirServers, setFhirServers] = useState<string[]>([]);
  const ctx = useContext(DataContext);

  async function fetchFHIRServerNames() {
    const servers = await getFhirServerNames();
    setFhirServers(servers);
  }

  useEffect(() => {
    fetchFHIRServerNames();
  }, []);

  // update the current page details when switching between modes,
  // so the SiteAlert displays the correct content
  useEffect(() => {
    ctx?.setCurrentPage(mode);
  }, [mode]);

  const [patientDiscoveryQueryResponse, setPatientDiscoveryQueryResponse] =
    useState<FhirQueryResponse>({});
  const [patientForQuery, setPatientForQueryResponse] = useState<Patient>();
  const [resultsQueryResponse, setResultsQueryResponse] =
    useState<FhirQueryResponse>({});

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
      {Object.keys(CUSTOMIZE_QUERY_STEPS).includes(mode) &&
        !showCustomizeQuery && (
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
          />
        )}

        {/* Step 2 */}
        {mode === "patient-results" && (
          <PatientSearchResults
            patients={patientDiscoveryQueryResponse?.Patient ?? []}
            goBack={() => setMode("search")}
            setMode={setMode}
            setPatientForQueryResponse={setPatientForQueryResponse}
            loading={loading}
          />
        )}

        {/* Step 3 */}
        {mode === "select-query" && selectedQuery && (
          <SelectQuery
            goBack={() => setMode("patient-results")}
            goForward={() => setMode("results")}
            patientForQuery={patientForQuery}
            resultsQueryResponse={resultsQueryResponse}
            showCustomizeQuery={showCustomizeQuery}
            setResultsQueryResponse={setResultsQueryResponse}
            setShowCustomizeQuery={setShowCustomizeQuery}
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
            fhirQueryResponse={resultsQueryResponse}
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
    </>
  );
};

export default Query;
