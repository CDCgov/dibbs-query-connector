import React from "react";
import Table from "@/app/query/designSystem/table/Table";
import { Condition } from "fhir/r4";
import { formatCodeableConcept, formatDate } from "../../../../format-service";
import { checkIfSomeElementWithPropertyExists } from "./utils";
import styles from "./resultsTables.module.scss";
import classNames from "classnames";

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
    <Table
      bordered={false}
      className={classNames(
        "margin-top-0-important",
        styles.conditionsTableContainer,
      )}
    >
      <thead>
        <tr className={styles.conditionRow}>
          <th>Condition</th>
          {availableElements.clinicalStatus && <th>Status</th>}
          {availableElements.onsetDateTime && <th>Onset</th>}
          {availableElements.abatementDateTime && <th>Resolution</th>}
        </tr>
      </thead>
      <tbody>
        {conditions.map((condition) => (
          <tr className={styles.conditionRow} key={condition.id}>
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
