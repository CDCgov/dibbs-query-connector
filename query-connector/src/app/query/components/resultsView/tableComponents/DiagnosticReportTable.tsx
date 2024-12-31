import React from "react";
import Table from "@/app/query/designSystem/table/Table";
import { DiagnosticReport } from "fhir/r4";
import { formatCodeableConcept, formatDate } from "../../../../format-service";
import styles from "./resultsTables.module.scss";
/**
 * The props for the DiagnosticReportTable component.
 */
export interface DiagnosticReportTableProps {
  diagnosticReports: DiagnosticReport[];
}

/**
 * Displays a table of data from array of DiagnosticReport resources.
 * @param props - DiagnosticReport table props.
 * @param props.diagnosticReports - The array of DiagnosticReport resources.
 * @returns - The DiagnosticReportTable component.
 */
const DiagnosticReportTable: React.FC<DiagnosticReportTableProps> = ({
  diagnosticReports,
}) => {
  return (
    <Table className="margin-top-0-important">
      <thead>
        <tr className={styles.diagnosticsRow}>
          <th>Date</th>
          <th>Code</th>
        </tr>
      </thead>
      <tbody>
        {diagnosticReports.map((diagnosticReport) => (
          <tr className={styles.diagnosticsRow} key={diagnosticReport.id}>
            <td>{formatDate(diagnosticReport?.effectiveDateTime)}</td>
            <td>{formatCodeableConcept(diagnosticReport.code)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default DiagnosticReportTable;
