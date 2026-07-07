import { render, screen, within } from "@testing-library/react";
import { Observation } from "fhir/r4";
import ObservationTable from "./ObservationTable";

const baseObs: Observation = {
  resourceType: "Observation",
  id: "obs-1",
  status: "final",
  code: { text: "Glucose" },
  issued: "2023-01-15T10:00:00Z",
  valueQuantity: { value: 5.4, unit: "mg/dL" },
};

describe("ObservationTable", () => {
  it("renders the base columns and a quantity value, omitting optional columns when absent", () => {
    render(<ObservationTable observations={[baseObs]} />);

    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toEqual(["Date", "Type", "Value"]);
    // Optional columns should not be rendered when no observation has them.
    expect(screen.queryByText("Interpretation")).not.toBeInTheDocument();
    expect(screen.queryByText("Reference Range")).not.toBeInTheDocument();

    expect(screen.getByText("01/15/2023")).toBeInTheDocument();
    expect(screen.getByText("Glucose")).toBeInTheDocument();
    expect(screen.getByText("5.4 mg/dL")).toBeInTheDocument();
  });

  it("renders the Interpretation and Reference Range columns when present", () => {
    const observations: Observation[] = [
      {
        ...baseObs,
        id: "obs-with-optional",
        interpretation: [{ text: "High" }],
        referenceRange: [
          {
            high: { value: 10, unit: "mg/dL" },
            low: { value: 2, unit: "mg/dL" },
          },
        ],
      },
    ];

    render(<ObservationTable observations={observations} />);

    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toEqual([
      "Date",
      "Type",
      "Interpretation",
      "Value",
      "Reference Range",
    ]);
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText(/HIGH: 10 mg\/dL/)).toBeInTheDocument();
    expect(screen.getByText(/LOW: 2 mg\/dL/)).toBeInTheDocument();
  });

  it("renders an empty interpretation cell when the column exists but a row lacks a value", () => {
    const observations: Observation[] = [
      {
        ...baseObs,
        id: "has-interp",
        interpretation: [{ text: "Normal" }],
      },
      {
        ...baseObs,
        id: "empty-interp",
        interpretation: [], // column present overall, but this row is empty
      },
    ];

    render(<ObservationTable observations={observations} />);

    expect(screen.getByText("Interpretation")).toBeInTheDocument();
    const emptyRow = screen.getByRole("row", {
      name: /01\/15\/2023 Glucose 5.4 mg\/dL/,
    });
    // 4 cells: Date, Type, (empty) Interpretation, Value
    const cells = within(emptyRow).getAllByRole("cell");
    expect(cells[2]).toHaveTextContent("");
  });

  it("formats codeable concept and string values, and reference-range text", () => {
    const observations: Observation[] = [
      {
        resourceType: "Observation",
        id: "coded",
        status: "final",
        code: { text: "Blood type" },
        effectiveDateTime: "2022-06-01",
        valueCodeableConcept: { text: "O Positive" },
        referenceRange: [{ text: "N/A" }],
      },
      {
        resourceType: "Observation",
        id: "stringval",
        status: "final",
        code: { text: "Notes" },
        valueString: "Patient stable",
        referenceRange: [{ text: "See notes" }],
      },
    ];

    render(<ObservationTable observations={observations} />);

    // effectiveDateTime used when issued is absent
    expect(screen.getByText("06/01/2022")).toBeInTheDocument();
    expect(screen.getByText("O Positive")).toBeInTheDocument();
    expect(screen.getByText("Patient stable")).toBeInTheDocument();
    expect(screen.getByText("N/A")).toBeInTheDocument();
    expect(screen.getByText("See notes")).toBeInTheDocument();
  });

  it("renders an empty value cell when an observation has no recognizable value", () => {
    const observations: Observation[] = [
      {
        resourceType: "Observation",
        id: "novalue",
        status: "final",
        code: { text: "Empty" },
      },
    ];

    render(<ObservationTable observations={observations} />);
    const row = screen.getByRole("row", { name: /Empty/ });
    const cells = within(row).getAllByRole("cell");
    // Date (empty), Type (Empty), Value (empty)
    expect(cells[2]).toHaveTextContent("");
  });
});
