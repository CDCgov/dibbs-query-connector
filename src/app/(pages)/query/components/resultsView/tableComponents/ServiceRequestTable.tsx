import React from "react";
import Table from "@/app/ui/designSystem/table/Table";
import { ServiceRequest } from "fhir/r4";
import {
  formatCodeableConcept,
  formatDate,
} from "../../../../../utils/format-service";
import { checkIfSomeElementWithPropertyExists } from "./utils";

/**
 * The props for the ServiceRequestTable component.
 */
export interface ServiceRequestTableProps {
  serviceRequests: ServiceRequest[];
}

/**
 * Displays a table of data from array of ServiceRequests resources.
 * @param root0 - ServiceRequest table props.
 * @param root0.ServiceRequests - The array of ServiceRequest resources.
 * @returns - The ServiceRequestTable component.
 */
const ServiceRequestTable: React.FC<ServiceRequestTableProps> = ({
  serviceRequests,
}) => {
  const availableElements = checkIfSomeElementWithPropertyExists(
    serviceRequests,
    ["requester"],
  );

  return (
    <Table contained={false}>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          {availableElements.requester && <th>Requester</th>}
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {serviceRequests.map((obs) => (
          <tr key={obs.id}>
            <td>{formatDate(obs?.authoredOn)}</td>
            <td>{formatCodeableConcept(obs.code)}</td>
            <td>{formatCodeableConcept(obs.requester)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
export default ServiceRequestTable;

/**
 * Formats the value of an ServiceRequest object for display.
 * @param obs - The ServiceRequest object.
 * @returns The value of the ServiceRequest object formatted for display.
 */
