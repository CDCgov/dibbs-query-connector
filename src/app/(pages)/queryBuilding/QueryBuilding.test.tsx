import QueryBuilding from "./page";
import { render, screen, waitFor } from "@testing-library/react";
import { getQueryList } from "@/app/backend/query-building/service";
import { RootProviderMock } from "@/app/tests/unit/setup";
import { getConditionsData } from "@/app/backend/seeding/service";

jest.mock("@/app/backend/query-building/service", () => ({
  getQueryList: jest.fn(),
}));

jest.mock("@/app/backend/seeding/service", () => ({
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
  const currentPage = "/";

  it("renders", async () => {
    (getQueryList as jest.Mock).mockResolvedValue([]);

    render(
      <RootProviderMock currentPage={currentPage} data={[]}>
        <QueryBuilding />
      </RootProviderMock>,
    );

    // Wait for the asynchronous data to resolve and the component to update
    await waitFor(() => {
      expect(screen.getByText("Start with Query Builder")).toBeInTheDocument();
      expect(screen).toMatchSnapshot();
    });
  });
});
