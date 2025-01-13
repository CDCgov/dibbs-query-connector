import QueryBuilding from "./page";
import { render, screen, waitFor } from "@testing-library/react";
import { DataContext } from "@/app/DataProvider";
import { getConditionsData, getCustomQueries } from "../database-service";
import { conditionIdToNameMap, defaultQueries } from "./fixtures";

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
    (getCustomQueries as jest.Mock).mockResolvedValue(defaultQueries);
    (getConditionsData as jest.Mock).mockResolvedValue({
      conditionIdToNameMap,
    });

    const mockSetData = jest.fn();
    const mockContextValue = {
      data: defaultQueries,
      setData: mockSetData,
    };

    render(
      <DataContext.Provider value={mockContextValue}>
        <QueryBuilding />
      </DataContext.Provider>,
    );

    const expectedQueryNames = defaultQueries.map((q) => q.query_name);

    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Query Library")).toBeInTheDocument();
    expectedQueryNames.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });

    expect(screen).toMatchSnapshot();
  });
});
