import { render, screen, waitFor, within } from "@testing-library/react";
import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import MyQueriesDisplay from "./QueryRepository";
import { getConditionsData } from "@/app/backend/query-building/service";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { handleCopy, confirmDelete } from "./utils";
import { conditionIdToNameMap } from "../fixtures";
import { CustomUserQuery } from "@/app/models/entities/query";

jest.mock("@/app/backend/query-building/service", () => ({
  getConditionsData: jest.fn(),
}));

jest.mock("@/app/ui/designSystem/toast/Toast", () => ({
  showToastConfirmation: jest.fn(),
}));

jest.mock("./utils", () => {
  const actual = jest.requireActual("./utils");
  return {
    ...actual,
    handleCopy: jest.fn(),
    confirmDelete: jest.fn(),
  };
});

const mockGetConditionsData = getConditionsData as jest.Mock;

const QUERIES: CustomUserQuery[] = [
  {
    queryId: "cancer-id",
    queryName: "Cancer case investigation",
    conditionsList: ["2"],
  },
  {
    queryId: "custom-id",
    queryName: "Bespoke query",
    conditionsList: ["custom"],
  },
  {
    queryId: "medical-id",
    queryName: "Newborn with sections",
    conditionsList: ["1"],
    medicalRecordSections: {
      immunizations: true,
    } as CustomUserQuery["medicalRecordSections"],
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockGetConditionsData.mockResolvedValue({ conditionIdToNameMap });
});

const currentPage = "/";

describe("MyQueriesDisplay (QueryRepository)", () => {
  it("renders the loading skeleton while loading", async () => {
    render(
      <RootProviderMock currentPage={currentPage}>
        <MyQueriesDisplay
          queries={[]}
          setBuildStep={jest.fn()}
          setQueries={jest.fn()}
          loading={true}
        />
      </RootProviderMock>,
    );

    expect(
      screen.getByTestId("repository-loading-skeleton"),
    ).toBeInTheDocument();
    // allow the conditions-data effect to settle to avoid act warnings
    await waitFor(() => expect(mockGetConditionsData).toHaveBeenCalled());
  });

  it("renders query rows with resolved condition names, custom, and medical sections", async () => {
    render(
      <RootProviderMock currentPage={currentPage}>
        <MyQueriesDisplay
          queries={QUERIES}
          setBuildStep={jest.fn()}
          setQueries={jest.fn()}
          loading={false}
        />
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
    });
    // custom-only query maps to the custom condition name
    expect(
      screen.getByText("Additional codes from library"),
    ).toBeInTheDocument();
    // medical record section appended
    expect(
      screen.getByText("Newborn Screening, Additional custom fields"),
    ).toBeInTheDocument();
    expect(screen.getByText("Query repository")).toBeInTheDocument();
  });

  it("advances the build step and resets context on Create query", async () => {
    const setBuildStep = jest.fn();
    const setData = jest.fn();
    const { user } = renderWithUser(
      <RootProviderMock currentPage={currentPage} setData={setData}>
        <MyQueriesDisplay
          queries={QUERIES}
          setBuildStep={setBuildStep}
          setQueries={jest.fn()}
          loading={false}
        />
      </RootProviderMock>,
    );

    await user.click(screen.getByRole("button", { name: "Create query" }));

    expect(setBuildStep).toHaveBeenCalledWith("condition");
    expect(setData).toHaveBeenCalledWith(null);
  });

  it("moves to the valueset step when Edit is clicked", async () => {
    const setBuildStep = jest.fn();
    const { user } = renderWithUser(
      <RootProviderMock currentPage={currentPage}>
        <MyQueriesDisplay
          queries={QUERIES}
          setBuildStep={setBuildStep}
          setQueries={jest.fn()}
          loading={false}
        />
      </RootProviderMock>,
    );

    await waitFor(() => screen.getByTestId("edit-query-cancer-id"));
    await user.click(screen.getByTestId("edit-query-cancer-id"));

    expect(setBuildStep).toHaveBeenCalledWith("valueset");
  });

  it("shows an error toast when edit is attempted without a data context", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    // Rendered without RootProviderMock => no setSelectedQuery available.
    const { user } = renderWithUser(
      <MyQueriesDisplay
        queries={QUERIES}
        setBuildStep={jest.fn()}
        setQueries={jest.fn()}
        loading={false}
      />,
    );

    await waitFor(() => screen.getByTestId("edit-query-cancer-id"));
    await user.click(screen.getByTestId("edit-query-cancer-id"));

    expect(showToastConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "error" }),
    );
    errorSpy.mockRestore();
  });

  it("calls handleCopy and confirmDelete from the row actions", async () => {
    const { user } = renderWithUser(
      <RootProviderMock currentPage={currentPage}>
        <MyQueriesDisplay
          queries={QUERIES}
          setBuildStep={jest.fn()}
          setQueries={jest.fn()}
          loading={false}
        />
      </RootProviderMock>,
    );

    await waitFor(() => screen.getByTestId("query-row-cancer-id"));
    const row = within(screen.getByTestId("query-row-cancer-id"));

    await user.click(row.getByText("Copy ID"));
    expect(handleCopy).toHaveBeenCalledWith(
      "Cancer case investigation",
      "cancer-id",
    );

    await user.click(row.getByText("Delete"));
    expect(confirmDelete).toHaveBeenCalledWith(
      "Cancer case investigation",
      "cancer-id",
      expect.any(Function),
      expect.anything(),
    );
  });
});
