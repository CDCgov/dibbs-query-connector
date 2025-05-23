import { renderWithUser } from "@/app/tests/unit/setup";
import ResultsView from "./ResultsView";
import { screen } from "@testing-library/react";

const TEST_QUERY = {
  queryId: "some-query-id",
  queryName: "some name",
  valuesets: [],
};

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
});
