import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { RootProviderMock } from "@/app/tests/unit/setup";
import SelectSavedQuery from "./SelectSavedQuery";
import { getSavedQuerySummaries } from "@/app/backend/query-building/service";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { useSession } from "next-auth/react";
import { UserRole } from "@/app/models/entities/users";
import { CustomUserQuery } from "@/app/models/entities/query";

jest.mock("@/app/backend/query-building/service", () => ({
  getSavedQuerySummaries: jest.fn(),
}));

jest.mock("@/app/ui/designSystem/toast/Toast", () => ({
  showToastConfirmation: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// mocked so the import chains through userManagement/utils and
// QueryRedirectDisplay don't pull in the real db pool, which keeps jest's
// process alive after the run
jest.mock("@/app/utils/auth", () => ({
  isAuthDisabledClientCheck: jest.fn(() => false),
}));

jest.mock("@/app/backend/user-management", () => ({
  getAllAdmins: jest.fn().mockResolvedValue([]),
}));

jest.mock("./NoQueriesDisplay", () => ({
  __esModule: true,
  default: () => <div data-testid="no-queries-display" />,
}));

const mockGetSavedQuerySummaries = getSavedQuerySummaries as jest.Mock;
const mockUseSession = useSession as jest.Mock;

const TEST_QUERIES = [
  { queryId: "q1", queryName: "Chlamydia case investigation" },
  { queryId: "q2", queryName: "Syphilis case investigation" },
];

const TEST_FHIR_SERVERS = ["HELIOS Meld", "Direwolf"];

const blankQuery: CustomUserQuery = {
  queryId: "",
  queryName: "",
  valuesets: [],
};

const defaultProps = {
  selectedQuery: blankQuery,
  setSelectedQuery: jest.fn(),
  fhirServer: TEST_FHIR_SERVERS[0],
  fhirServers: TEST_FHIR_SERVERS,
  goBack: jest.fn(),
  handleSubmit: jest.fn(),
  setFhirServer: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSession.mockReturnValue({
    data: { user: { username: "tester", role: UserRole.SUPER_ADMIN } },
  });
  mockGetSavedQuerySummaries.mockResolvedValue(TEST_QUERIES);
});

describe("SelectSavedQuery", () => {
  it("renders the available queries as dropdown options", async () => {
    render(
      <RootProviderMock currentPage="/query">
        <SelectSavedQuery {...defaultProps} />
      </RootProviderMock>,
    );

    await waitFor(() =>
      expect(screen.getByLabelText("Query")).toBeInTheDocument(),
    );

    expect(mockGetSavedQuerySummaries).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("option", { name: "Chlamydia case investigation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Syphilis case investigation" }),
    ).toBeInTheDocument();
  });

  it("selects a query with empty valuesets when an option is chosen", async () => {
    const setSelectedQuery = jest.fn();
    render(
      <RootProviderMock currentPage="/query">
        <SelectSavedQuery
          {...defaultProps}
          setSelectedQuery={setSelectedQuery}
        />
      </RootProviderMock>,
    );

    await waitFor(() =>
      expect(screen.getByLabelText("Query")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByLabelText("Query"), {
      target: { value: "Syphilis case investigation" },
    });

    expect(setSelectedQuery).toHaveBeenCalledWith({
      queryId: "q2",
      queryName: "Syphilis case investigation",
      valuesets: [],
    });
  });

  it("shows the FHIR servers from props behind the advanced toggle", async () => {
    render(
      <RootProviderMock currentPage="/query">
        <SelectSavedQuery {...defaultProps} />
      </RootProviderMock>,
    );

    await waitFor(() =>
      expect(screen.getByLabelText("Query")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Advanced..." }));

    TEST_FHIR_SERVERS.forEach((server) => {
      expect(screen.getByRole("option", { name: server })).toBeInTheDocument();
    });
  });

  it("shows the no-queries display when no queries are available", async () => {
    mockGetSavedQuerySummaries.mockResolvedValue([]);

    render(
      <RootProviderMock currentPage="/query">
        <SelectSavedQuery {...defaultProps} />
      </RootProviderMock>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("no-queries-display")).toBeInTheDocument(),
    );
  });

  it("shows an error toast when fetching queries fails", async () => {
    mockGetSavedQuerySummaries.mockRejectedValue(new Error("boom"));

    render(
      <RootProviderMock currentPage="/query">
        <SelectSavedQuery {...defaultProps} />
      </RootProviderMock>,
    );

    await waitFor(() =>
      expect(showToastConfirmation).toHaveBeenCalledWith({
        body: "An error occurred. Please try again later",
        variant: "error",
      }),
    );
  });
});
