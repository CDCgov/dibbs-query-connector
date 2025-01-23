import React from "react";
import Table from "@/app/designSystem/table/Table";
import { Encounter } from "fhir/r4";
import {
  formatCodeableConcept,
  formatCoding,
  formatDate,
} from "../../../../format-service";
import { checkIfSomeElementWithPropertyExists } from "./utils";
import styles from "./resultsTables.module.scss";

/**
 * The props for the EncounterTable component.
 */
export interface EncounterTableProps {
  encounters: Encounter[];
}

/**
 * Displays a table of data from array of Encounter resources.
 * @param root0 - Encounter table props.
 * @param root0.encounters - The array of Encounter resources.
 * @returns - The EncounterTable component.
 */
const EncounterTable: React.FC<EncounterTableProps> = ({
  encounters: encounters,
}) => {
  const availableElements = checkIfSomeElementWithPropertyExists(encounters, [
    "class",
    "serviceProvider",
    "serviceType",
  ]);

  return (
    <Table bordered={false} className="margin-top-0-important">
      <thead>
        <tr className={styles.encountersRow}>
          <th>Visit Reason</th>
          {availableElements?.class && <th>Clinic Type</th>}
          {availableElements?.serviceProvider && <th>Service Provider</th>}
          <th>Encounter Status</th>
          <th>Encounter Start</th>
          <th>Encounter End</th>
        </tr>
      </thead>
      <tbody>
        {encounters.map((encounter) => (
          <tr className={styles.encountersRow} key={encounter.id}>
            <td>{formatCodeableConcept(encounter?.reasonCode?.[0])} </td>
            {availableElements?.class && (
              <td>{formatCoding(encounter?.class)}</td>
            )}
            {availableElements?.serviceProvider && (
              <td>{encounter?.serviceProvider?.display}</td>
            )}
            <td>{encounter?.status}</td>
            <td>{formatDate(encounter?.period?.start)}</td>
            <td>{formatDate(encounter?.period?.end)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
export default EncounterTable;
