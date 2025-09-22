import QueryBuilding from "./page";
import { render, screen, waitFor } from "@testing-library/react";
import { conditionIdToNameMap, DEFAULT_QUERIES } from "./fixtures";
import { RootProviderMock } from "@/app/tests/unit/setup";
import {
  getConditionsData,
  getQueryList,
} from "@/app/backend/query-building/service";

jest.mock("@/app/backend/db-creation/service", () => ({
  checkDBForData: jest.fn().mockResolvedValue(true),
}));

jest.mock("../userManagement/utils", () => ({
  getRole: jest.fn(),
}));

jest.mock("@/app/backend/query-building/service", () => ({
  getQueryList: jest.fn(),
  getCustomQueries: jest.fn(),
  getConditionsData: jest.fn().mockResolvedValue({
    // here to prevent a distracting error log from showing up in test
    conditionIdToNameMap: {},
  }),
}));

jest.mock(
  "@/app/ui/components/withAuth/WithAuth",
  () =>
    ({ children }: React.PropsWithChildren) => <div>{children}</div>,
);

describe("tests the query building steps", () => {
  it("renders the empty state", async () => {
    (getQueryList as jest.Mock).mockResolvedValue([]);
    (getConditionsData as jest.Mock).mockResolvedValue({
      conditionIdToNameMap: {},
    });

    render(
      <RootProviderMock currentPage="/queryBuilding">
        <QueryBuilding />
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(
        screen.queryByTestId("repository-loading-skeleton"),
      ).not.toBeInTheDocument();
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
      expect(
        screen.queryByTestId("repository-loading-skeleton"),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText("Query repository")).toBeInTheDocument();

    expectedQueryNames.forEach(async (name) => {
      await waitFor(() => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });
    });
  });
});
