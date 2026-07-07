import { renderWithUser } from "@/app/tests/unit/setup";
import { fireEvent, render, screen } from "@testing-library/react";
import ResultsViewDrawer from "./ResultsViewDrawer";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import type { PatientRecordsResponse } from "@/app/backend/query-execution/service";

jest.mock("@/app/ui/designSystem/toast/Toast", () => ({
  showToastConfirmation: jest.fn(),
}));

const patientRecordsResponse = {
  Patient: [{ resourceType: "Patient", id: "p1" }],
  // A stringified-JSON value to exercise parseNestedJSON's recursive parse.
  Observation: ['{"resourceType":"Observation","id":"o1"}'],
  fhirRequests: [
    {
      method: "GET",
      url: "https://fhir.example.com/Patient?name=Unlucky",
    },
    {
      method: "POST",
      url: "https://fhir.example.com/Patient/$match",
      body: '{"resourceType":"Parameters"}',
    },
  ],
} as unknown as PatientRecordsResponse;

describe("ResultsViewDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the empty state when no response is loaded", () => {
    renderWithUser(
      <ResultsViewDrawer
        isOpen={true}
        onClose={jest.fn()}
        patientRecordsResponse={undefined}
      />,
    );

    expect(screen.getByText("No FHIR response loaded.")).toBeInTheDocument();
  });

  it("shows the Response payload by default with fhirRequests omitted", () => {
    renderWithUser(
      <ResultsViewDrawer
        isOpen={true}
        onClose={jest.fn()}
        patientRecordsResponse={patientRecordsResponse}
      />,
    );

    const body = screen.getByText(/resourceType/);
    // Response tab is the default; the Patient resource should be present.
    expect(body.textContent).toContain('"Patient"');
    expect(body.textContent).toContain('"Observation"');
    // The stringified Observation JSON should be parsed into a nested object,
    // not left as an escaped string.
    expect(body.textContent).toContain('"id": "o1"');
    // fhirRequests key is stripped from the Response payload.
    expect(body.textContent).not.toContain("fhirRequests");
  });

  it("switches to the Request tab to show captured FHIR requests", async () => {
    const { user } = renderWithUser(
      <ResultsViewDrawer
        isOpen={true}
        onClose={jest.fn()}
        patientRecordsResponse={patientRecordsResponse}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Request" }));

    const body = screen.getByText(/GET https/);
    expect(body.textContent).toContain(
      "GET https://fhir.example.com/Patient?name=Unlucky",
    );
    expect(body.textContent).toContain(
      "POST https://fhir.example.com/Patient/$match",
    );
    // POST body is indented on the next line.
    expect(body.textContent).toContain('{"resourceType":"Parameters"}');
  });

  it("shows a placeholder on the Request tab when no requests were recorded", async () => {
    const noRequests = {
      Patient: [{ resourceType: "Patient", id: "p1" }],
      fhirRequests: [],
    } as unknown as PatientRecordsResponse;

    const { user } = renderWithUser(
      <ResultsViewDrawer
        isOpen={true}
        onClose={jest.fn()}
        patientRecordsResponse={noRequests}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Request" }));
    expect(screen.getByText("No FHIR requests recorded.")).toBeInTheDocument();
  });

  it("copies the active payload to the clipboard and confirms via toast", () => {
    // Use fireEvent + a plain clipboard mock here; userEvent installs its own
    // clipboard stub whose readText path is unreliable under jsdom.
    const writeText = jest.fn();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <ResultsViewDrawer
        isOpen={true}
        onClose={jest.fn()}
        patientRecordsResponse={patientRecordsResponse}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('"Patient"');
    expect(showToastConfirmation).toHaveBeenCalledWith({
      body: "Copied to clipboard",
    });
  });
});
