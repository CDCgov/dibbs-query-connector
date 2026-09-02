import { Observation } from "fhir/r4";
import {
  checkIfSomeElementWithPropertyExists,
  codeableConceptText,
  formatObservationValue,
} from "./utils";

describe("formatObservationValue", () => {
  const base: Observation = {
    resourceType: "Observation",
    status: "final",
    code: { text: "Test" },
  };

  it("joins a quantity's value and unit", () => {
    expect(
      formatObservationValue({
        ...base,
        valueQuantity: { value: 5.4, unit: "mg/dL" },
      }),
    ).toBe("5.4 mg/dL");
  });

  it("returns a string value as is", () => {
    expect(
      formatObservationValue({ ...base, valueString: "Lungs are clear." }),
    ).toBe("Lungs are clear.");
  });

  it("trims padding around a string value but keeps interior line breaks", () => {
    expect(
      formatObservationValue({
        ...base,
        valueString: " \r\nNo findings.\r\n\r\nRefer to cardiology.\r\n\r\n",
      }),
    ).toBe("No findings.\r\n\r\nRefer to cardiology.");
  });

  it("formats a codeable concept value", () => {
    // formatCodeableConcept renders JSX, so just confirm a value came back.
    expect(
      formatObservationValue({
        ...base,
        valueCodeableConcept: { text: "Detected" },
      }),
    ).toBeTruthy();
  });

  it("returns an empty string when there is no recognizable value", () => {
    expect(formatObservationValue(base)).toBe("");
  });
});

describe("codeableConceptText", () => {
  it("prefers text, then the first coding's display, then its code", () => {
    expect(
      codeableConceptText({
        text: "Chest X-ray",
        coding: [{ display: "XR Chest", code: "36643-5" }],
      }),
    ).toBe("Chest X-ray");
    expect(
      codeableConceptText({
        coding: [{ display: "XR Chest", code: "36643-5" }],
      }),
    ).toBe("XR Chest");
    expect(codeableConceptText({ coding: [{ code: "36643-5" }] })).toBe(
      "36643-5",
    );
  });

  it("returns an empty string for a missing or empty concept", () => {
    expect(codeableConceptText(undefined)).toBe("");
    expect(codeableConceptText({})).toBe("");
    expect(codeableConceptText({ coding: [] })).toBe("");
  });
});

describe("checkIfSomeElementWithPropertyExists", () => {
  it("reports every checked property as false for an empty array", () => {
    expect(
      checkIfSomeElementWithPropertyExists<
        { a?: number; b?: number },
        "a" | "b"
      >([], ["a", "b"]),
    ).toEqual({ a: false, b: false });
  });

  it("flags a property true when at least one element has it", () => {
    const array = [{ a: 1 }, { b: 2 }] as { a?: number; b?: number }[];
    expect(checkIfSomeElementWithPropertyExists(array, ["a", "b"])).toEqual({
      a: true,
      b: true,
    });
  });

  it("keeps a property false when no element has it", () => {
    const array = [{ a: 1 }] as { a?: number; b?: number }[];
    expect(checkIfSomeElementWithPropertyExists(array, ["a", "b"])).toEqual({
      a: true,
      b: false,
    });
  });
});
