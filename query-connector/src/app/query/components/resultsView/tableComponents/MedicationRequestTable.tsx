import React from "react";
import Table from "@/app/query/designSystem/table/Table";
import { MedicationRequest } from "fhir/r4";
import { formatCodeableConcept, formatDate } from "../../../../format-service";
import { checkIfSomeElementWithPropertyExists } from "./utils";
import styles from "./resultsTables.module.scss";

/**
 * The props for the MedicationRequestTable component.
 */
export interface MedicationRequestTableProps {
  medicationRequests: MedicationRequest[];
}

/**
 * Displays a table of data from array of MedicationRequest resources.
 * @param props - MedicationRequest table props.
 * @param props.medicationRequests - The array of MedicationRequest resources.
 * @returns - The MedicationRequestTable component.
 */
const MedicationRequestTable: React.FC<MedicationRequestTableProps> = ({
  medicationRequests,
}) => {
  const availableElements = checkIfSomeElementWithPropertyExists(
    medicationRequests,
    ["reasonCode"],
  );

  return (
    <Table bordered={false} className="margin-top-0-important">
      <thead>
        <tr className={styles.medicationRow}>
          <th>Order Date</th>
          <th>Medication</th>
          {availableElements.reasonCode && <th>Reason Code</th>}
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {medicationRequests.map((medicationRequest) => (
          <tr className={styles.medicationRow} key={medicationRequest.id}>
            <td>{formatDate(medicationRequest.authoredOn)}</td>
            <td>
              {formatCodeableConcept(
                medicationRequest.medicationCodeableConcept,
              )}
            </td>
            {availableElements.reasonCode && (
              <td>
                {formatCodeableConcept(medicationRequest?.reasonCode?.[0])}
              </td>
            )}
            <td>{medicationRequest.status}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default MedicationRequestTable;
