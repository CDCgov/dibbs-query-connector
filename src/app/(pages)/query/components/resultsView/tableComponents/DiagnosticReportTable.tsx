import React, { useMemo } from "react";
import Table from "@/app/ui/designSystem/table/Table";
import { DiagnosticReport, Observation } from "fhir/r4";
import {
  formatCodeableConcept,
  formatDate,
} from "../../../../../utils/format-service";
import { referencedResourceId } from "../../../../../utils/fhir-reference";
import { codeableConceptText, formatObservationValue } from "./utils";
import styles from "./resultsTables.module.scss";
import classNames from "classnames";

/**
 * The props for the DiagnosticReportTable component.
 */
export interface DiagnosticReportTableProps {
  diagnosticReports: DiagnosticReport[];
  observations?: Observation[];
}

/**
 * Displays a table of data from array of DiagnosticReport resources.
 * @param props - DiagnosticReport table props.
 * @param props.diagnosticReports - The array of DiagnosticReport resources.
 * @param props.observations - Observation resources returned with the query,
 * used to show the results (a narrative, an impression, panel members) that a
 * report references rather than carries itself.
 * @returns - The DiagnosticReportTable component.
 */
const DiagnosticReportTable: React.FC<DiagnosticReportTableProps> = ({
  diagnosticReports,
  observations = [],
}) => {
  const observationIndex = useMemo(
    () =>
      new Map(
        observations
          .filter((obs) => obs.id)
          .map((obs) => [obs.id as string, obs]),
      ),
    [observations],
  );
  const hasResults = diagnosticReports.some(
    (report) => (report.result?.length ?? 0) > 0,
  );

  return (
    <Table
      contained={false}
      className={classNames(hasResults && styles.diagnosticReportsFixedTable)}
    >
      <thead>
        <tr>
          <th>Date</th>
          <th>Code</th>
          {hasResults && <th>Results</th>}
        </tr>
      </thead>
      <tbody>
        {diagnosticReports.map((diagnosticReport) => (
          <tr key={diagnosticReport.id}>
            <td>{formatDate(diagnosticReport?.effectiveDateTime)}</td>
            <td>{formatCodeableConcept(diagnosticReport.code)}</td>
            {hasResults && (
              <td>{renderResults(diagnosticReport, observationIndex)}</td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default DiagnosticReportTable;

/**
 * Renders each Observation a report's `result` element references, resolved
 * against the Observations returned with the query. A result whose
 * Observation wasn't returned shows its reference display alone; one with
 * neither is skipped.
 * @param report - The DiagnosticReport whose results to render.
 * @param observationIndex - Observations returned with the query, keyed by id.
 * @returns One block per displayable result.
 */
function renderResults(
  report: DiagnosticReport,
  observationIndex: Map<string, Observation>,
) {
  return (report.result ?? []).map((ref, index) => {
    const id = referencedResourceId(ref.reference, "Observation");
    const observation = id ? observationIndex.get(id) : undefined;
    const label =
      ref.display ?? (observation ? codeableConceptText(observation.code) : "");
    const value = observation ? formatObservationValue(observation) : "";
    if (!label && !value) return null;
    return (
      // A report can list the same reference more than once, so the key
      // can't be the reference alone.
      <div key={index} className={styles.reportResult}>
        {label && <strong>{label}</strong>}
        {value && <div>{value}</div>}
      </div>
    );
  });
}
