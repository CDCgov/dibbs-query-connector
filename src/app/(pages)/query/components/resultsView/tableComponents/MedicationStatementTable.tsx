import React from "react";
import Table from "@/app/ui/designSystem/table/Table";
import { MedicationStatement } from "fhir/r4";
import {
  formatCodeableConcept,
  formatDate,
} from "../../../../../utils/format-service";
import styles from "./resultsTables.module.scss";
import { checkIfSomeElementWithPropertyExists } from "./utils";
import classNames from "classnames";

/**
 * The props for the MedicationStatementTable component.
 */
export interface MedicationStatementTableProps {
  medicationStatements: MedicationStatement[];
}

/**
 * Displays a table of data from array of MedicationStatement resources.
 * @param props - MedicationStatement table props.
 * @param props.medicationStatements - The array of MedicationStatement resources.
 * @returns - The MedicationStatementTable component.
 */
const MedicationStatementTable: React.FC<MedicationStatementTableProps> = ({
  medicationStatements,
}) => {
  const availableElements = checkIfSomeElementWithPropertyExists(
    medicationStatements,
    ["reasonCode"],
  );

  return (
    <Table
      contained={false}
      className={classNames(
        availableElements.reasonCode && styles.medicationsFixedTable,
      )}
    >
      <thead>
        <tr>
          <th>Effective Date</th>
          <th>Medication</th>
          {availableElements.reasonCode && <th>Reason Code</th>}
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {medicationStatements.map((medicationStatement) => (
          <tr key={medicationStatement.id}>
            <td>
              {formatDate(
                medicationStatement.effectiveDateTime ??
                  medicationStatement.effectivePeriod?.start,
              )}
            </td>
            <td>
              {formatCodeableConcept(
                medicationStatement.medicationCodeableConcept,
              )}
            </td>
            {availableElements.reasonCode && (
              <td>
                {formatCodeableConcept(medicationStatement?.reasonCode?.[0])}
              </td>
            )}
            <td>{medicationStatement.status}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default MedicationStatementTable;
