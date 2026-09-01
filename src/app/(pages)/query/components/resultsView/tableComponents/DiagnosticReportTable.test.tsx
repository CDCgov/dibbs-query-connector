import { render, screen, within } from "@testing-library/react";
import { DiagnosticReport, Observation } from "fhir/r4";
import DiagnosticReportTable from "./DiagnosticReportTable";

const baseReport: DiagnosticReport = {
  resourceType: "DiagnosticReport",
  id: "dr-1",
  status: "final",
  code: { text: "XR Chest 2 Views" },
  effectiveDateTime: "2026-02-25T08:00:00Z",
};

const NARRATIVE_TEXT =
  "FINDINGS:\nThe lungs are clear.\n\nNo pleural effusion or pneumothorax.";

const narrative: Observation = {
  resourceType: "Observation",
  id: "obs-narrative",
  status: "final",
  code: { text: "Narrative" },
  valueString: NARRATIVE_TEXT,
};

const impression: Observation = {
  resourceType: "Observation",
  id: "obs-impression",
  status: "final",
  code: { text: "Impression" },
  valueString: "No acute cardiopulmonary process.",
};

function headers() {
  return screen.getAllByRole("columnheader").map((h) => h.textContent);
}

describe("DiagnosticReportTable", () => {
  it("renders only Date and Code when no report references results", () => {
    render(<DiagnosticReportTable diagnosticReports={[baseReport]} />);

    expect(headers()).toEqual(["Date", "Code"]);
    expect(screen.getByText("02/25/2026")).toBeInTheDocument();
    expect(screen.getByText("XR Chest 2 Views")).toBeInTheDocument();
  });

  it("does not add the Results column for an empty result list", () => {
    render(
      <DiagnosticReportTable
        diagnosticReports={[{ ...baseReport, result: [] }]}
        observations={[narrative]}
      />,
    );

    expect(headers()).toEqual(["Date", "Code"]);
  });

  it("shows each referenced Observation's text under its reference display, keeping line breaks", () => {
    const report: DiagnosticReport = {
      ...baseReport,
      result: [
        { reference: "Observation/obs-narrative", display: "Narrative" },
        { reference: "Observation/obs-impression", display: "Impression" },
      ],
    };

    render(
      <DiagnosticReportTable
        diagnosticReports={[report]}
        observations={[narrative, impression]}
      />,
    );

    expect(headers()).toEqual(["Date", "Code", "Results"]);
    const row = screen.getByRole("row", { name: /XR Chest 2 Views/ });
    const resultsCell = within(row).getAllByRole("cell")[2];
    expect(within(resultsCell).getByText("Narrative")).toBeInTheDocument();
    expect(within(resultsCell).getByText("Impression")).toBeInTheDocument();
    // Matched without whitespace normalization so the paragraph breaks are
    // asserted, not collapsed away.
    expect(
      within(resultsCell).getByText(NARRATIVE_TEXT, {
        normalizer: (text) => text,
      }),
    ).toBeInTheDocument();
    expect(
      within(resultsCell).getByText("No acute cardiopulmonary process."),
    ).toBeInTheDocument();
  });

  it("labels a result with the Observation's code when the reference has no display", () => {
    const glucose: Observation = {
      resourceType: "Observation",
      id: "obs-glucose",
      status: "final",
      code: { text: "Glucose" },
      valueQuantity: { value: 5.4, unit: "mg/dL" },
    };
    const report: DiagnosticReport = {
      ...baseReport,
      code: { text: "Metabolic panel" },
      result: [{ reference: "Observation/obs-glucose" }],
    };

    render(
      <DiagnosticReportTable
        diagnosticReports={[report]}
        observations={[glucose]}
      />,
    );

    const row = screen.getByRole("row", { name: /Metabolic panel/ });
    const resultsCell = within(row).getAllByRole("cell")[2];
    expect(within(resultsCell).getByText("Glucose")).toBeInTheDocument();
    expect(within(resultsCell).getByText("5.4 mg/dL")).toBeInTheDocument();
  });

  it("falls back to the reference display alone when the Observation wasn't returned", () => {
    const report: DiagnosticReport = {
      ...baseReport,
      result: [
        { reference: "Observation/obs-missing", display: "Narrative" },
        // Neither a display nor a resolvable Observation: nothing to show.
        { reference: "Observation/obs-also-missing" },
      ],
    };

    render(<DiagnosticReportTable diagnosticReports={[report]} />);

    const row = screen.getByRole("row", { name: /XR Chest 2 Views/ });
    const resultsCell = within(row).getAllByRole("cell")[2];
    expect(within(resultsCell).getByText("Narrative")).toBeInTheDocument();
    expect(resultsCell.querySelectorAll("div")).toHaveLength(1);
  });

  it("leaves the Results cell empty for a report without results when another report has them", () => {
    const withResults: DiagnosticReport = {
      ...baseReport,
      id: "dr-with",
      result: [
        { reference: "Observation/obs-impression", display: "Impression" },
      ],
    };
    const without: DiagnosticReport = {
      ...baseReport,
      id: "dr-without",
      code: { text: "CBC" },
    };

    render(
      <DiagnosticReportTable
        diagnosticReports={[withResults, without]}
        observations={[impression]}
      />,
    );

    const row = screen.getByRole("row", { name: /CBC/ });
    const cells = within(row).getAllByRole("cell");
    expect(cells).toHaveLength(3);
    expect(cells[2]).toHaveTextContent("");
  });
});
