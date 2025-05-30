import QueryBuilding from "./page";
import { render, screen, waitFor } from "@testing-library/react";
import { getConditionsData } from "../../shared/database-service";
import { conditionIdToNameMap, DEFAULT_QUERIES } from "./fixtures";
import { RootProviderMock } from "@/app/tests/unit/setup";
import { getQueryList } from "@/app/backend/query-building/service";

jest.mock(".../../../shared/database-service", () => ({
  getConditionsData: jest.fn(),
}));

jest.mock("@/app/backend/query-building/service", () => ({
  getQueryList: jest.fn(),
  getCustomQueries: jest.fn(),
}));

jest.mock(
  "@/app/ui/components/withAuth/WithAuth",
  () =>
    ({ children }: React.PropsWithChildren) => <div>{children}</div>,
);

describe("tests the query building steps", () => {
  it("renders the empty state", async () => {
    (getQueryList as jest.Mock).mockResolvedValue([]);

    render(
      <RootProviderMock currentPage="/queryBuilding">
        <QueryBuilding />
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Start with Query Builder")).toBeInTheDocument();
    expect(screen.getByTestId("empty-state-container")).toMatchSnapshot();
  });

  it("renders the default state", async () => {
    (getConditionsData as jest.Mock).mockResolvedValue({
      conditionIdToNameMap,
    });

    render(
      <RootProviderMock currentPage="/queryBuilding" data={DEFAULT_QUERIES}>
        <QueryBuilding />
      </RootProviderMock>,
    );

    const expectedQueryNames = DEFAULT_QUERIES.map((q) => q.queryName);

    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Query repository")).toBeInTheDocument();

    expectedQueryNames.forEach(async (name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });
});
