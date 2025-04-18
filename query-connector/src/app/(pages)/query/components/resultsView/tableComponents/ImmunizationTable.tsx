import React from "react";
import Table from "@/app/ui/designSystem/table/Table";
import { Immunization } from "fhir/r4";
import {
  formatDate,
  formatImmunizationRoute,
} from "../../../../../shared/format-service";

/**
 * The props for the ImmunizationTable component.
 */
export interface ImmunizationTableProps {
  immunizations: Immunization[];
}

/**
 * Displays a table of data from array of Immunization resources.
 * @param props - Immunization table props.
 * @param props.immunizations - The array of Immunization resources.
 * @returns - The ImmunizationTable component.
 */
const ImmunizationTable: React.FC<ImmunizationTableProps> = ({
  immunizations,
}) => {
  return (
    <Table contained={false} className="margin-top-0-important">
      <thead>
        <tr>
          <th>Date</th>
          <th>Vaccine name</th>
          <th>Dose</th>
          <th>Route</th>
        </tr>
      </thead>
      <tbody>
        {immunizations.map((immunization) => (
          <tr key={immunization.id}>
            <td>{formatDate(immunization.occurrenceDateTime)}</td>
            <td>{immunization.vaccineCode?.coding?.[0].display}</td>
            <td>
              {immunization.doseQuantity?.value}{" "}
              {immunization.doseQuantity?.code}
            </td>
            <td>{formatImmunizationRoute(immunization)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default ImmunizationTable;
