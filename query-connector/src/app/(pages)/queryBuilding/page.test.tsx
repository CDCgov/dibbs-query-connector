import QueryBuilding from "./page";
import { render, screen, waitFor } from "@testing-library/react";
import { DataContext } from "@/app/shared/DataProvider";
import {
  getConditionsData,
  getCustomQueries,
} from "../../shared/database-service";
import { conditionIdToNameMap, DEFAULT_QUERIES } from "./fixtures";

jest.mock(".../../../shared/database-service", () => ({
  getCustomQueries: jest.fn(),
  getConditionsData: jest.fn(),
}));

describe("tests the query building steps", () => {
  it("renders the empty state", async () => {
    (getCustomQueries as jest.Mock).mockResolvedValue([]);

    const mockSetData = jest.fn();
    const mockSetCurrentPage = jest.fn();
    const mockSetToatConfig = jest.fn();
    const mockContextValue = {
      data: undefined,
      setData: mockSetData,
      currentPage: "/queryBuilding",
      setCurrentPage: mockSetCurrentPage,
      toastConfig: {},
      setToastConfig: mockSetToatConfig,
    };

    render(
      <DataContext.Provider value={mockContextValue}>
        <QueryBuilding />
      </DataContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Start with Query Builder")).toBeInTheDocument();
    expect(screen.getByTestId("empty-state-container")).toMatchSnapshot();
  });

  it("renders the default state", async () => {
    (getCustomQueries as jest.Mock).mockResolvedValue(DEFAULT_QUERIES);
    (getConditionsData as jest.Mock).mockResolvedValue({
      conditionIdToNameMap,
    });

    const mockSetData = jest.fn();
    const mockSetCurrentPage = jest.fn();
    const mockSetToatConfig = jest.fn();
    const mockContextValue = {
      data: DEFAULT_QUERIES,
      setData: mockSetData,
      currentPage: "/queryBuilding",
      setCurrentPage: mockSetCurrentPage,
      toastConfig: {},
      setToastConfig: mockSetToatConfig,
    };

    render(
      <DataContext.Provider value={mockContextValue}>
        <QueryBuilding />
      </DataContext.Provider>,
    );

    const expectedQueryNames = DEFAULT_QUERIES.map((q) => q.query_name);

    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Query Library")).toBeInTheDocument();
    expectedQueryNames.forEach(async (name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });
});
