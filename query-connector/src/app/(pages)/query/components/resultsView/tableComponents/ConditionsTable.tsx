import React from "react";
import Table from "@/app/ui/designSystem/table/Table";
import { Condition } from "fhir/r4";
import {
  formatCodeableConcept,
  formatDate,
} from "../../../../../shared/format-service";
import { checkIfSomeElementWithPropertyExists } from "./utils";

/**
 * The props for the ConditionTable component.
 */
export interface ConditionTableProps {
  conditions: Condition[];
}

/**
 * Displays a table of data from array of Condition resources.
 * @param props - Condition table props.
 * @param props.conditions - The array of Condition resources.
 * @returns - The ConditionTable component.
 */
const ConditionsTable: React.FC<ConditionTableProps> = ({ conditions }) => {
  const availableElements = checkIfSomeElementWithPropertyExists(conditions, [
    "abatementDateTime",
    "clinicalStatus",
    "onsetDateTime",
  ]);

  return (
    <Table contained={false}>
      <thead>
        <tr>
          <th>Condition</th>
          {availableElements.clinicalStatus && <th>Status</th>}
          {availableElements.onsetDateTime && <th>Onset</th>}
          {availableElements.abatementDateTime && <th>Resolution</th>}
        </tr>
      </thead>
      <tbody>
        {conditions.map((condition) => (
          <tr key={condition.id}>
            <td>{formatCodeableConcept(condition.code ?? {})}</td>
            {availableElements.clinicalStatus && (
              <td>{formatCodeableConcept(condition.clinicalStatus ?? {})}</td>
            )}
            {availableElements.onsetDateTime && (
              <td>{formatDate(condition.onsetDateTime)}</td>
            )}
            {availableElements.abatementDateTime && (
              <td>{formatDate(condition.abatementDateTime)}</td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default ConditionsTable;
