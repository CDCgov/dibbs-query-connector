import QueryBuilding from "./page";
import { render, screen, waitFor } from "@testing-library/react";
import { DataContext } from "@/app/DataProvider";
import { getConditionsData, getCustomQueries } from "../database-service";
import { conditionIdToNameMap, DEFAULT_QUERIES } from "./fixtures";

jest.mock("../database-service", () => ({
  getCustomQueries: jest.fn(),
  getConditionsData: jest.fn(),
}));

describe("tests the query building steps", () => {
  it("renders the empty state", async () => {
    (getCustomQueries as jest.Mock).mockResolvedValue([]);

    const mockSetData = jest.fn();
    const mockContextValue = {
      data: undefined,
      setData: mockSetData,
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
    expect(screen).toMatchSnapshot();
  });
  it("renders the default state", async () => {
    (getCustomQueries as jest.Mock).mockResolvedValue(DEFAULT_QUERIES);
    (getConditionsData as jest.Mock).mockResolvedValue({
      conditionIdToNameMap,
    });

    const mockSetData = jest.fn();
    const mockContextValue = {
      data: DEFAULT_QUERIES,
      setData: mockSetData,
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

    await expect(screen.getByText("Query Library")).toBeInTheDocument();
    expectedQueryNames.forEach(async (name) => {
      await expect(screen.getByText(name)).toBeInTheDocument();
    });

    expect(screen).toMatchSnapshot();
  });
});
