import React from "react";
import Table from "@/app/ui/designSystem/table/Table";
import { Encounter } from "fhir/r4";
import {
  formatCodeableConcept,
  formatCoding,
  formatDate,
} from "../../../../../shared/format-service";
import { checkIfSomeElementWithPropertyExists } from "./utils";

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
    <Table contained={false}>
      <thead>
        <tr>
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
          <tr key={encounter.id}>
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
