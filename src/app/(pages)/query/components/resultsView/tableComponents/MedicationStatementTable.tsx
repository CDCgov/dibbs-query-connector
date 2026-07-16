import React, { useMemo } from "react";
import Table from "@/app/ui/designSystem/table/Table";
import { Medication, MedicationStatement } from "fhir/r4";
import {
  formatCodeableConcept,
  formatDate,
} from "../../../../../utils/format-service";
import {
  buildMedicationIndex,
  resolveMedicationConcept,
} from "@/backend/query-execution/medication-filter";
import styles from "./resultsTables.module.scss";
import { checkIfSomeElementWithPropertyExists } from "./utils";
import classNames from "classnames";

/**
 * The props for the MedicationStatementTable component.
 */
export interface MedicationStatementTableProps {
  medicationStatements: MedicationStatement[];
  medications?: Medication[];
}

/**
 * Displays a table of data from array of MedicationStatement resources.
 * @param props - MedicationStatement table props.
 * @param props.medicationStatements - The array of MedicationStatement resources.
 * @param props.medications - Medication resources returned with the query,
 * used to name statements that only reference their medication.
 * @returns - The MedicationStatementTable component.
 */
const MedicationStatementTable: React.FC<MedicationStatementTableProps> = ({
  medicationStatements,
  medications = [],
}) => {
  const availableElements = checkIfSomeElementWithPropertyExists(
    medicationStatements,
    ["reasonCode"],
  );
  const medicationIndex = useMemo(
    () => buildMedicationIndex(medications),
    [medications],
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
                resolveMedicationConcept(medicationStatement, medicationIndex),
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
