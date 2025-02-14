import QueryBuilding from "./page";
import { render, screen, waitFor } from "@testing-library/react";
import { DataContext } from "@/app/shared/DataProvider";
import { getCustomQueries } from "../../shared/database-service";

jest.mock("../../shared/database-service", () => ({
  getCustomQueries: jest.fn(),
}));

describe("tests the query building steps", () => {
  it("renders", async () => {
    (getCustomQueries as jest.Mock).mockResolvedValue([]);

    const mockSetData = jest.fn();
    const mockSetCurrentPage = jest.fn();
    const mockSetToatConfig = jest.fn();
    const mockContextValue = {
      data: [],
      setData: mockSetData,
      currentPage: "/",
      setCurrentPage: mockSetCurrentPage,
      toastConfig: {},
      setToastConfig: mockSetToatConfig,
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
