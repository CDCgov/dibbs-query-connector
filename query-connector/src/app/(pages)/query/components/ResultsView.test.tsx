import { renderWithUser } from "@/app/tests/unit/setup";
import ResultsView from "./ResultsView";
import { screen } from "@testing-library/react";

const TEST_QUERY = {
  query_id: "some-query-id",
  query_name: "some name",
  valuesets: [],
};

describe("ResultsView", () => {
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
