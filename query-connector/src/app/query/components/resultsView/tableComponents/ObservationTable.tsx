import React from "react";
import Table from "@/app/query/designSystem/Table";
import { Observation } from "fhir/r4";
import { formatCodeableConcept, formatDate } from "../../../../format-service";
import { checkIfSomeElementWithPropertyExists } from "./utils";
/**
 * The props for the ObservationTable component.
 */
export interface ObservationTableProps {
  observations: Observation[];
}

/**
 * Displays a table of data from array of Observations resources.
 * @param root0 - Observation table props.
 * @param root0.observations - The array of Observation resources.
 * @returns - The ObservationTable component.
 */
const ObservationTable: React.FC<ObservationTableProps> = ({
  observations,
}) => {
  const anyObsInterpretation = checkIfSomeElementWithPropertyExists(
    observations,
    "interpretation",
  );
  const anyReferenceRange = checkIfSomeElementWithPropertyExists(
    observations,
    "referenceRange",
  );
  return (
    <Table className="margin-top-0-important">
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          {anyObsInterpretation && <th>Interpretation</th>}
          <th>Value</th>
          {anyReferenceRange && <th>Reference Range</th>}
        </tr>
      </thead>
      <tbody>
        {observations.map((obs) => (
          <tr key={obs.id}>
            <td>{formatDate(obs?.issued || obs?.effectiveDateTime)}</td>
            <td>{formatCodeableConcept(obs.code)}</td>
            {anyObsInterpretation && (
              <td>
                {obs?.interpretation && obs.interpretation.length > 0
                  ? formatCodeableConcept(obs.interpretation[0])
                  : ""}
              </td>
            )}
            <td>{formatValue(obs)}</td>
            {anyReferenceRange && <td>{formatReferenceRange(obs)}</td>}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
export default ObservationTable;

/**
 * Formats the value of an Observation object for display.
 * @param obs - The Observation object.
 * @returns The value of the Observation object formatted for display.
 */
function formatValue(obs: Observation) {
  if (obs.valueCodeableConcept) {
    return formatCodeableConcept(obs.valueCodeableConcept);
  } else if (obs.valueQuantity) {
    return [obs.valueQuantity.value, obs.valueQuantity.unit].join(" ");
  } else if (obs.valueString) {
    return obs.valueString;
  }
  return "";
}

/**
 * Formats the reference range of an Observation object for display.
 * @param obs - The Observation object.
 * @returns The reference range of the Observation object formatted for display.
 */
function formatReferenceRange(obs: Observation) {
  if (!obs.referenceRange || obs.referenceRange.length === 0) {
    return "";
  }
  const range = obs.referenceRange[0];

  if (range.high || range.low) {
    return (
      <>
        {["HIGH:", range.high?.value, range.high?.unit].join(" ")} <br />{" "}
        {["LOW:", range.low?.value, range.low?.unit].join(" ")}
      </>
    );
  } else if (range.text) {
    return range.text;
  }
  return "";
}
