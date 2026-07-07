import { renderWithUser } from "@/app/tests/unit/setup";
import ResultsView from "./ResultsView";
import { screen } from "@testing-library/react";
import type { PatientRecordsResponse } from "../../../backend/query-execution/service";

const TEST_QUERY = {
  queryId: "some-query-id",
  queryName: "some name",
  valuesets: [],
};

const POPULATED_RESPONSE = {
  Patient: [
    {
      resourceType: "Patient",
      id: "p1",
      name: [{ given: ["Hyper"], family: "Unlucky" }],
      birthDate: "1975-12-06",
      gender: "female",
    },
  ],
  Observation: [
    {
      resourceType: "Observation",
      id: "o1",
      status: "final",
      code: { text: "Glucose" },
      issued: "2023-01-15T10:00:00Z",
      valueQuantity: { value: 5.4, unit: "mg/dL" },
    },
  ],
  Condition: [
    {
      resourceType: "Condition",
      id: "c1",
      code: { text: "Chlamydia" },
    },
  ],
  MedicationRequest: [
    {
      resourceType: "MedicationRequest",
      id: "mr1",
      status: "active",
      intent: "order",
      subject: { reference: "Patient/p1" },
      medicationCodeableConcept: { text: "Azithromycin" },
    },
  ],
  MedicationStatement: [
    {
      resourceType: "MedicationStatement",
      id: "ms1",
      status: "active",
      subject: { reference: "Patient/p1" },
      medicationCodeableConcept: { text: "Ibuprofen" },
    },
  ],
  Immunization: [
    {
      resourceType: "Immunization",
      id: "i1",
      status: "completed",
      vaccineCode: { text: "Flu" },
      patient: { reference: "Patient/p1" },
      occurrenceDateTime: "2023-01-01",
    },
  ],
  fhirRequests: [{ method: "GET", url: "https://fhir.example.com/Patient" }],
} as unknown as PatientRecordsResponse;

describe("ResultsView", () => {
  beforeAll(() => {
    const windowMock = {
      scrollTo: jest.fn(),
    };

    Object.assign(global, windowMock);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it("Should render a skeleton loading state when loading is true", () => {
    renderWithUser(
      <ResultsView
        patientRecordsResponse={undefined}
        selectedQuery={TEST_QUERY}
        goBack={() => {}}
        goToBeginning={() => {}}
        loading={true}
      ></ResultsView>,
    );

    expect(screen.getByTestId("banner-loading-skeleton")).toBeInTheDocument();
  });

  it("renders the query name and the back / new-search controls when not loading", () => {
    renderWithUser(
      <ResultsView
        patientRecordsResponse={POPULATED_RESPONSE}
        selectedQuery={TEST_QUERY}
        goBack={() => {}}
        goToBeginning={() => {}}
        loading={false}
      />,
    );

    expect(screen.getByText("some name")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New patient search" }),
    ).toBeInTheDocument();
    // The skeleton banner should not be present when loaded.
    expect(
      screen.queryByTestId("banner-loading-skeleton"),
    ).not.toBeInTheDocument();
  });

  it("renders accordion sections and resource content for a populated response", () => {
    renderWithUser(
      <ResultsView
        patientRecordsResponse={POPULATED_RESPONSE}
        selectedQuery={TEST_QUERY}
        goBack={() => {}}
        goToBeginning={() => {}}
        loading={false}
      />,
    );

    // Section titles appear in both the side nav and the accordion.
    expect(screen.getAllByText("Observations").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Conditions").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Medications").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Immunizations").length).toBeGreaterThan(0);

    // The Medications section renders both request and statement subtables.
    expect(screen.getByText("Medication Requests")).toBeInTheDocument();
    expect(screen.getByText("Medication Statements")).toBeInTheDocument();

    // Rendered child-table content confirms the resources were mapped through.
    expect(screen.getByText("Hyper Unlucky")).toBeInTheDocument();
    expect(screen.getByText("Glucose")).toBeInTheDocument();
  });

  it("invokes goBack and goToBeginning from the banner controls", async () => {
    const goBack = jest.fn();
    const goToBeginning = jest.fn();

    const { user } = renderWithUser(
      <ResultsView
        patientRecordsResponse={POPULATED_RESPONSE}
        selectedQuery={TEST_QUERY}
        goBack={goBack}
        goToBeginning={goToBeginning}
        loading={false}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "New patient search" }),
    );
    expect(goToBeginning).toHaveBeenCalledTimes(1);

    await user.click(screen.getByText(/Return to/i));
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it("opens and closes the FHIR request & response drawer", async () => {
    const { user } = renderWithUser(
      <ResultsView
        patientRecordsResponse={POPULATED_RESPONSE}
        selectedQuery={TEST_QUERY}
        goBack={() => {}}
        goToBeginning={() => {}}
        loading={false}
      />,
    );

    // Drawer starts closed.
    expect(screen.getByTestId("drawer-open-false")).toBeInTheDocument();

    await user.click(screen.getByTestId("view-fhir-response-button"));

    expect(screen.getByTestId("drawer-open-true")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-title")).toHaveTextContent(
      "FHIR request & response",
    );

    await user.click(screen.getByTestId("close-drawer"));
    expect(screen.getByTestId("drawer-open-false")).toBeInTheDocument();
  });

  it("omits sections whose resources are absent from the response", () => {
    const patientOnly = {
      Patient: [
        {
          resourceType: "Patient",
          id: "p1",
          name: [{ given: ["Solo"], family: "Person" }],
        },
      ],
      fhirRequests: [],
    } as unknown as PatientRecordsResponse;

    renderWithUser(
      <ResultsView
        patientRecordsResponse={patientOnly}
        selectedQuery={TEST_QUERY}
        goBack={() => {}}
        goToBeginning={() => {}}
        loading={false}
      />,
    );

    // Patient Info renders, but sections without resources are not shown.
    expect(screen.getByText("Solo Person")).toBeInTheDocument();
    expect(screen.queryByText("Observations")).not.toBeInTheDocument();
    expect(screen.queryByText("Medications")).not.toBeInTheDocument();
    expect(screen.queryByText("Immunizations")).not.toBeInTheDocument();
  });

  it("renders no accordion sections when the response is undefined and not loading", () => {
    renderWithUser(
      <ResultsView
        patientRecordsResponse={undefined}
        selectedQuery={TEST_QUERY}
        goBack={() => {}}
        goToBeginning={() => {}}
        loading={false}
      />,
    );

    // The accordion container is present but empty (no resource sections).
    const accordion = screen.getByTestId("accordion");
    expect(accordion).toBeEmptyDOMElement();
  });
});
