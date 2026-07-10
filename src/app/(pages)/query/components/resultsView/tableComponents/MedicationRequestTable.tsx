import React, { useMemo } from "react";
import Table from "@/app/ui/designSystem/table/Table";
import { Medication, MedicationRequest } from "fhir/r4";
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
 * The props for the MedicationRequestTable component.
 */
export interface MedicationRequestTableProps {
  medicationRequests: MedicationRequest[];
  medications?: Medication[];
}

/**
 * Displays a table of data from array of MedicationRequest resources.
 * @param props - MedicationRequest table props.
 * @param props.medicationRequests - The array of MedicationRequest resources.
 * @param props.medications - Medication resources returned with the query,
 * used to name requests that only reference their medication.
 * @returns - The MedicationRequestTable component.
 */
const MedicationRequestTable: React.FC<MedicationRequestTableProps> = ({
  medicationRequests,
  medications = [],
}) => {
  const availableElements = checkIfSomeElementWithPropertyExists(
    medicationRequests,
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
          <th>Order Date</th>
          <th>Medication</th>
          {availableElements.reasonCode && <th>Reason Code</th>}
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {medicationRequests.map((medicationRequest) => (
          <tr key={medicationRequest.id}>
            <td>{formatDate(medicationRequest.authoredOn)}</td>
            <td>
              {formatCodeableConcept(
                resolveMedicationConcept(medicationRequest, medicationIndex),
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
