import { renderWithUser } from "@/app/tests/unit/setup";
import { screen } from "@testing-library/react";
import PatientSearchResults from "./PatientSearchResults";

describe("PatientSearchResults", () => {
  beforeAll(() => {
    const windowMock = {
      scrollTo: jest.fn(),
    };

    Object.assign(global, windowMock);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it("should render a skeleton loading state when loading is true", () => {
    renderWithUser(
      <PatientSearchResults
        patients={[]}
        goBack={() => {}}
        setMode={() => {}}
        setPatientForQueryResponse={() => {}}
        uncertainMatchError={false}
        loading={true}
      ></PatientSearchResults>,
    );

    expect(screen.getByTestId("loading-table-header")).toBeInTheDocument();
    expect(screen.getByTestId("loading-table-header")).toBeInTheDocument();
  });
});
