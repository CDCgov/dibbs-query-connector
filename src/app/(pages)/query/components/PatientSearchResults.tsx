import React, { useEffect } from "react";
import { Patient } from "fhir/r4";

import { Mode } from "@/app/shared/constants";
import Backlink from "../../../ui/designSystem/backLink/Backlink";
import PatientSearchResultsTable from "./patientSearchResults/PatientSearchResultsTable";
import NoPatientsFound from "./patientSearchResults/NoPatientsFound";
import { RETURN_LABEL } from "@/app/(pages)/query/components/stepIndicator/StepIndicator";
import TitleBox from "./stepIndicator/TitleBox";

/**
 * The props for the PatientSearchResults component.
 */
export interface PatientSearchResultsProps {
  patients: Patient[];
  goBack: () => void;
  setMode: (mode: Mode) => void;
  setPatientForQueryResponse: (patient: Patient) => void;
  loading: boolean;
}

/**
 * Displays multiple patient search results in a table.
 * @param root0 - PatientSearchResults props.
 * @param root0.patients - The array of Patient resources.
 * @param root0.goBack - The function to go back to the previous page.
 * @param root0.setMode - Redirect function to handle results view routing
 * @param root0.setPatientForQueryResponse - Callback function to update the
 * patient being searched for
 * @param root0.loading - whether the component is in a loading state
 * @returns - The PatientSearchResults component.
 */
const PatientSearchResults: React.FC<PatientSearchResultsProps> = ({
  patients,
  goBack,
  setPatientForQueryResponse,
  setMode,
  loading,
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
      {(loading || patients.length > 0) && (
        <>
          <Backlink onClick={goBack} label={RETURN_LABEL["patient-results"]} />

          <TitleBox step="patient-results" />

          <PatientSearchResultsTable
            patients={patients}
            handlePatientSelect={handlePatientSelect}
            loading={loading}
          />
        </>
      )}

      {!loading && patients.length === 0 && (
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
    </>
  );
};

export default PatientSearchResults;
