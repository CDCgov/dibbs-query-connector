import { UseCaseQueryResponse } from "../../query-service";
import ResultsViewSideNav, {
  NavSection,
} from "./resultsView/ResultsViewSideNav";
import React, { useEffect } from "react";
import ResultsViewTable from "./resultsView/ResultsViewTable";
import styles from "./resultsView/resultsView.module.scss";
import ConditionsTable from "./resultsView/tableComponents/ConditionsTable";
import Demographics from "./resultsView/tableComponents/Demographics";
import DiagnosticReportTable from "./resultsView/tableComponents/DiagnosticReportTable";
import EncounterTable from "./resultsView/tableComponents/EncounterTable";
import MedicationRequestTable from "./resultsView/tableComponents/MedicationRequestTable";
import ObservationTable from "./resultsView/tableComponents/ObservationTable";
import Backlink from "./backLink/Backlink";
import { RETURN_LABEL } from "@/app/query/components/stepIndicator/StepIndicator";
import TitleBox from "./stepIndicator/TitleBox";
import ImmunizationTable from "./resultsView/tableComponents/ImmunizationTable";
import { CustomUserQuery } from "@/app/query-building";

type ResultsViewProps = {
  useCaseQueryResponse: UseCaseQueryResponse;
  selectedQuery: CustomUserQuery;
  goBack: () => void;
  goToBeginning: () => void;
};

export type ResultsViewAccordionItem = {
  title: string;
  subtitle?: string;
  content?: React.ReactNode;
};

/**
 * The QueryView component to render the query results.
 * @param props - The props for the QueryView component.
 * @param props.useCaseQueryResponse - The response from the query service.
 * @param props.goBack - The function to go back to the previous page.
 * @param props.goToBeginning - Function to return to patient discover
 * @param props.selectedQuery - query that's been selected to view for results
 * @returns The QueryView component.
 */
const ResultsView: React.FC<ResultsViewProps> = ({
  useCaseQueryResponse,
  selectedQuery,
  goBack,
  goToBeginning,
}) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const accordionItems =
    mapQueryResponseToAccordionDataStructure(useCaseQueryResponse);

  const sideNavContent = accordionItems
    .map((item) => {
      if (item.content) {
        return { title: item.title, subtitle: item?.subtitle };
      }
    })
    .filter((i) => Boolean(i)) as NavSection[];

  return (
    <>
      <div className={`${styles.resultsBannerContent}`}>
        <Backlink onClick={() => goBack()} label={RETURN_LABEL["results"]} />
        <button
          className="usa-button usa-button--outline margin-left-auto"
          onClick={() => goToBeginning()}
        >
          New patient search
        </button>
      </div>
      <TitleBox step="results" />
      <h2 className="page-explainer margin-bottom-3-important margin-top-0-important">
        <strong>Query: </strong>
        <span className="text-normal display-inline-block">
          {selectedQuery.query_name}
        </span>
      </h2>

      <div className=" grid-container grid-row grid-gap-md padding-0 ">
        <div className="tablet:grid-col-3">
          <ResultsViewSideNav items={sideNavContent} />
        </div>
        <div className="tablet:grid-col-9 ecr-content">
          <ResultsViewTable accordionItems={accordionItems} />
        </div>
      </div>
    </>
  );
};
export default ResultsView;

function mapQueryResponseToAccordionDataStructure(
  useCaseQueryResponse: UseCaseQueryResponse,
) {
  const patient =
    useCaseQueryResponse.Patient && useCaseQueryResponse.Patient.length === 1
      ? useCaseQueryResponse.Patient[0]
      : null;
  const observations = useCaseQueryResponse.Observation
    ? useCaseQueryResponse.Observation
    : null;
  const encounters = useCaseQueryResponse.Encounter
    ? useCaseQueryResponse.Encounter
    : null;
  const conditions = useCaseQueryResponse.Condition
    ? useCaseQueryResponse.Condition
    : null;
  const diagnosticReports = useCaseQueryResponse.DiagnosticReport
    ? useCaseQueryResponse.DiagnosticReport
    : null;
  const medicationRequests = useCaseQueryResponse.MedicationRequest
    ? useCaseQueryResponse.MedicationRequest
    : null;
  const immunizations = useCaseQueryResponse.Immunization
    ? useCaseQueryResponse.Immunization
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
