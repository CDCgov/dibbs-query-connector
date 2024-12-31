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
  const anyResolution = checkIfSomeElementWithPropertyExists(
    conditions,
    "abatementDateTime",
  );

  const anyStatus = checkIfSomeElementWithPropertyExists(
    conditions,
    "clinicalStatus",
  );

  const anyOnset = checkIfSomeElementWithPropertyExists(
    conditions,
    "onsetDateTime",
  );

  return (
    <Table
      className={classNames(
        "margin-top-0-important",
        styles.conditionsTableContainer,
      )}
    >
      <thead>
        <tr className={styles.conditionRow}>
          <th>Condition</th>
          {anyStatus && <th>Status</th>}
          {anyOnset && <th>Onset</th>}
          {anyResolution && <th>Resolution</th>}
        </tr>
      </thead>
      <tbody>
        {conditions.map((condition) => (
          <tr className={styles.conditionRow} key={condition.id}>
            <td>{formatCodeableConcept(condition.code ?? {})}</td>
            {anyStatus && (
              <td>{formatCodeableConcept(condition.clinicalStatus ?? {})}</td>
            )}
            {anyOnset && <td>{formatDate(condition.onsetDateTime)}</td>}
            {anyResolution && (
              <td>{formatDate(condition.abatementDateTime)}</td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default ConditionsTable;
