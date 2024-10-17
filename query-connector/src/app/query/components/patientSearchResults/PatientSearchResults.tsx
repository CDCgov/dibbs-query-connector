import React, { useEffect } from "react";
import { Patient } from "fhir/r4";

import { Mode } from "@/app/constants";
import Backlink from "../backLink/Backlink";
import PatientSearchResultsTable from "./PatientSearchResultsTable";
import NoPatientsFound from "./NoPatientsFound";

/**
 * The props for the PatientSearchResults component.
 */
export interface PatientSearchResultsProps {
  patients: Patient[];
  goBack: () => void;
  setMode: (mode: Mode) => void;
  setPatientForQueryResponse: (patient: Patient) => void;
}

/**
 * Displays multiple patient search results in a table.
 * @param root0 - PatientSearchResults props.
 * @param root0.patients - The array of Patient resources.
 * @param root0.goBack - The function to go back to the previous page.
 * @param root0.setMode - Redirect function to handle results view routing
 * @param root0.setPatientForQueryResponse - Callback function to update the
 * patient being searched for
 * @returns - The PatientSearchResults component.
 */
const PatientSearchResults: React.FC<PatientSearchResultsProps> = ({
  patients,
  goBack,
  setPatientForQueryResponse,
  setMode,
}) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function handlePatientSelect(patient: Patient) {
    setPatientForQueryResponse(patient);
    setMode("select-query");
  }

  return (
    <>
      {patients.length === 0 && (
        <>
          <NoPatientsFound />
          <a
            href="#"
            className="usa-link unchanged-color-on-visit"
            onClick={goBack}
          >
            Revise your patient search
          </a>
        </>
      )}
      {patients.length > 0 && (
        <>
          <Backlink onClick={goBack} label={RETURN_TO_STEP_ONE_LABEL} />

          <PatientSearchResultsTable
            patients={patients}
            handlePatientSelect={handlePatientSelect}
          />
        </>
      )}
    </>
  );
};

export default PatientSearchResults;
export const RETURN_TO_STEP_ONE_LABEL = "Return to Enter patient info";
