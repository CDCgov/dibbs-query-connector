import QueryBuilding from "./page";
import { render, screen, waitFor } from "@testing-library/react";
import { DataContext } from "@/app/DataProvider";
import { getCustomQueries } from "../database-service";

jest.mock("../database-service", () => ({
  getCustomQueries: jest.fn(),
}));

describe("tests the query building steps", () => {
  it("renders", async () => {
    (getCustomQueries as jest.Mock).mockResolvedValue([]);

    const mockSetData = jest.fn();
    const mockContextValue = {
      data: [],
      setData: mockSetData,
    };

    render(
      <DataContext.Provider value={mockContextValue}>
        <QueryBuilding />
      </DataContext.Provider>,
    );

    // Wait for the asynchronous data to resolve and the component to update
    await waitFor(() => {
      expect(screen.getByText("Start with Query Builder")).toBeInTheDocument();

      expect(screen).toMatchSnapshot();
    });
  });
});
