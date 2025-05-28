import { PatientRecordsResponse } from "../../../backend/query-execution";
import ResultsViewSideNav, {
  NavSection,
} from "./resultsView/ResultsViewSideNav";
import React, { useEffect, useState } from "react";
import ResultsViewTable from "./resultsView/ResultsViewTable";
import ResultsViewDrawer from "./resultsView/ResultsViewDrawer";
import styles from "./resultsView/resultsView.module.scss";
import ConditionsTable from "./resultsView/tableComponents/ConditionsTable";
import Demographics from "./resultsView/tableComponents/Demographics";
import DiagnosticReportTable from "./resultsView/tableComponents/DiagnosticReportTable";
import EncounterTable from "./resultsView/tableComponents/EncounterTable";
import MedicationRequestTable from "./resultsView/tableComponents/MedicationRequestTable";
import ObservationTable from "./resultsView/tableComponents/ObservationTable";
import Backlink from "../../../ui/designSystem/backLink/Backlink";
import { RETURN_LABEL } from "@/app/(pages)/query/components/stepIndicator/StepIndicator";
import TitleBox from "./stepIndicator/TitleBox";
import ImmunizationTable from "./resultsView/tableComponents/ImmunizationTable";
import { CustomUserQuery } from "@/app/models/entities/query";
import Skeleton from "react-loading-skeleton";
import { Button } from "@trussworks/react-uswds";

type ResultsViewProps = {
  patientRecordsResponse: PatientRecordsResponse | undefined;
  selectedQuery: CustomUserQuery;
  goBack: () => void;
  goToBeginning: () => void;
  loading: boolean;
};

export type ResultsViewAccordionItem = {
  title: string;
  subtitle?: string;
  content?: React.ReactNode;
};

/**
 * The QueryView component to render the query results.
 * @param props - The props for the QueryView component.
 * @param props.patientRecordsResponse - The response from the query service.
 * @param props.goBack - The function to go back to the previous page.
 * @param props.goToBeginning - Function to return to patient discover
 * @param props.selectedQuery - query that's been selected to view for results
 * @param props.loading -  whether the component is in a loading state
 * @returns The QueryView component.
 */
const ResultsView: React.FC<ResultsViewProps> = ({
  patientRecordsResponse,
  selectedQuery,
  goBack,
  goToBeginning,
  loading,
}) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const accordionItems = mapQueryResponseToAccordionDataStructure(
    patientRecordsResponse,
  );

  const [drawerOpen, setDrawerOpen] = useState(false);

  const sideNavContent =
    accordionItems &&
    (accordionItems
      .map((item) => {
        if (item.content) {
          return { title: item.title, subtitle: item?.subtitle };
        }
      })
      .filter((i) => Boolean(i)) as NavSection[]);
  return (
    <>
      <div className={`${styles.resultsBannerContent}`}>
        {loading ? (
          <div data-testid={"banner-loading-skeleton"}>
            <Skeleton width={150} />
            <Skeleton width={200} height={50} />
          </div>
        ) : (
          <>
            <Backlink
              onClick={() => goBack()}
              label={RETURN_LABEL["results"]}
            />
            <Button secondary onClick={() => goToBeginning()} type={"button"}>
              New patient search
            </Button>
          </>
        )}
      </div>
      <TitleBox step="results" />
      <h2 className="page-explainer margin-bottom-3-important margin-top-0-important">
        <div className="display-flex flex-align-center">
          <strong>Query:&nbsp;</strong>
          <span className="text-normal display-inline-block">
            {selectedQuery.queryName}
          </span>
          <Button
            secondary
            data-testid="view-fhir-response-button"
            className={`usa-button--unstyled text-bold text-no-underline margin-left-auto`}
            type="button"
            onClick={() => setDrawerOpen(true)}
          >
            View FHIR response
          </Button>
        </div>
      </h2>

      <div className=" grid-container grid-row grid-gap-md padding-0 ">
        <div className="tablet:grid-col-3">
          <ResultsViewSideNav items={sideNavContent} loading={loading} />
        </div>
        <div className="tablet:grid-col-9 ecr-content">
          <ResultsViewTable accordionItems={accordionItems} loading={loading} />
        </div>
      </div>
      <div aria-hidden={!drawerOpen}>
        <ResultsViewDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          patientRecordsResponse={patientRecordsResponse}
        />
      </div>
    </>
  );
};
export default ResultsView;

function mapQueryResponseToAccordionDataStructure(
  resultsQueryResponse: PatientRecordsResponse | undefined,
) {
  if (resultsQueryResponse === undefined) return [];
  const patient =
    resultsQueryResponse.Patient && resultsQueryResponse.Patient.length === 1
      ? resultsQueryResponse.Patient[0]
      : null;
  const observations = resultsQueryResponse.Observation
    ? resultsQueryResponse.Observation
    : null;
  const encounters = resultsQueryResponse.Encounter
    ? resultsQueryResponse.Encounter
    : null;
  const conditions = resultsQueryResponse.Condition
    ? resultsQueryResponse.Condition
    : null;
  const diagnosticReports = resultsQueryResponse.DiagnosticReport
    ? resultsQueryResponse.DiagnosticReport
    : null;
  const medicationRequests = resultsQueryResponse.MedicationRequest
    ? resultsQueryResponse.MedicationRequest
    : null;
  const immunizations = resultsQueryResponse.Immunization
    ? resultsQueryResponse.Immunization
    : null;

  const accordionItems: ResultsViewAccordionItem[] = [
    {
      title: "Patient Info",
      subtitle: "Demographics",
      content: patient ? <Demographics patient={patient} /> : null,
    },
    {
      title: "Observations",
      content: observations ? (
        <ObservationTable observations={observations} />
      ) : null,
    },
    {
      title: "Encounters",
      content: encounters ? <EncounterTable encounters={encounters} /> : null,
    },
    {
      title: "Conditions",
      content: conditions ? <ConditionsTable conditions={conditions} /> : null,
    },
    {
      title: "Diagnostic Reports",
      content: diagnosticReports ? (
        <DiagnosticReportTable diagnosticReports={diagnosticReports} />
      ) : null,
    },
    {
      title: "Medication Requests",
      content: medicationRequests ? (
        <MedicationRequestTable medicationRequests={medicationRequests} />
      ) : null,
    },
    {
      title: "Immunizations",
      content: immunizations ? (
        <ImmunizationTable immunizations={immunizations} />
      ) : null,
    },
  ];
  return accordionItems;
}
