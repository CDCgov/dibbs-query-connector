import { CodeableConcept, Observation } from "fhir/r4";
import { formatCodeableConcept } from "../../../../../utils/format-service";

/**
 * Formats the value of an Observation for display, whichever value[x]
 * variant it carries.
 * @param obs - The Observation resource.
 * @returns The formatted value, or an empty string when the Observation has
 * no displayable value.
 */
export function formatObservationValue(obs: Observation) {
  if (obs.valueCodeableConcept) {
    return formatCodeableConcept(obs.valueCodeableConcept);
  } else if (obs.valueQuantity) {
    return [obs.valueQuantity.value, obs.valueQuantity.unit].join(" ");
  } else if (obs.valueString) {
    // Epic pads narrative text with leading and trailing line breaks, which
    // would otherwise render as blank lines in a pre-wrap cell.
    return obs.valueString.trim();
  }
  return "";
}

/**
 * Plain-text rendering of a CodeableConcept, for places where the JSX
 * produced by formatCodeableConcept doesn't fit (a label inside a cell).
 * @param concept - The CodeableConcept, if any.
 * @returns The concept's text, else its first coding's display, else that
 * coding's code, else an empty string.
 */
export function codeableConceptText(concept?: CodeableConcept): string {
  return (
    concept?.text ??
    concept?.coding?.[0]?.display ??
    concept?.coding?.[0]?.code ??
    ""
  );
}

/**
 * Helper function to not display tables in results view where there are no
 * elements in a column to display. Allows for non-lengthwise properties
 * @param array - an array of items to display in a table
 * @param propertiesToCheck - the property that we want to conditionally display
 * in a table column if some element exists
 * @returns true or false for whether there is any element that exists for the
 * column to be rendered
 */
export function checkIfSomeElementWithPropertyExists<
  T extends object,
  K extends keyof T,
>(array: T[], propertiesToCheck: K[]): Record<K, boolean> {
  const result: Record<K, boolean> = propertiesToCheck.reduce(
    (accumulation, p) => {
      accumulation[p] = false;
      return accumulation;
    },
    {} as Record<K, boolean>,
  );

  for (const resource of array) {
    for (const property of propertiesToCheck) {
      if (property in resource) {
        result[property] = true;
      }
    }
  }

  return result;
}
