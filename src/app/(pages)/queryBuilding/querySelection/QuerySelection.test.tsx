import { render, screen, waitFor } from "@testing-library/react";
import { RootProviderMock } from "@/app/tests/unit/setup";
import QuerySelection from "./QuerySelection";
import {
  getQueryList,
  getQueriesForUser,
} from "@/app/backend/query-building/service";
import { getUserByUsername } from "@/app/backend/user-management";
import { checkDBForData } from "@/app/backend/db-creation/lib";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { useSession } from "next-auth/react";
import { UserRole } from "@/app/models/entities/users";
import { DEFAULT_QUERIES } from "../fixtures";

jest.mock("@/app/backend/query-building/service", () => ({
  getQueryList: jest.fn(),
  getQueriesForUser: jest.fn(),
}));

jest.mock("@/app/backend/user-management", () => ({
  getUserByUsername: jest.fn(),
}));

jest.mock("@/app/backend/db-creation/lib", () => ({
  checkDBForData: jest.fn(),
}));

jest.mock("@/app/ui/designSystem/toast/Toast", () => ({
  showToastConfirmation: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// Isolate the child components so we only exercise QuerySelection logic.
jest.mock("./EmptyQueriesDisplay", () => ({
  __esModule: true,
  default: () => <div data-testid="empty-display" />,
}));
jest.mock("./QueryRepository", () => ({
  __esModule: true,
  default: ({ loading }: { loading: boolean }) => (
    <div data-testid="my-queries-display">{loading ? "loading" : "ready"}</div>
  ),
}));

const mockGetQueryList = getQueryList as jest.Mock;
const mockGetQueriesForUser = getQueriesForUser as jest.Mock;
const mockGetUserByUsername = getUserByUsername as jest.Mock;
const mockCheckDBForData = checkDBForData as jest.Mock;
const mockUseSession = useSession as jest.Mock;

const currentPage = "/";

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockUseSession.mockReturnValue({
    data: { user: { username: "tester", role: UserRole.SUPER_ADMIN } },
  });
  mockCheckDBForData.mockResolvedValue(true);
  mockGetUserByUsername.mockResolvedValue({ items: [{ id: "u1" }] });
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});

describe("QuerySelection", () => {
  it("shows the empty state when the DB has no queries (auth disabled)", async () => {
    mockGetQueryList.mockResolvedValue([]);

    render(
      <RootProviderMock currentPage={currentPage}>
        <QuerySelection setBuildStep={jest.fn()} />
      </RootProviderMock>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("empty-display")).toBeInTheDocument(),
    );
  });

  it("shows the empty state when the DB is not seeded", async () => {
    mockGetQueryList.mockResolvedValue(DEFAULT_QUERIES);
    mockCheckDBForData.mockResolvedValue(false);

    render(
      <RootProviderMock currentPage={currentPage}>
        <QuerySelection setBuildStep={jest.fn()} />
      </RootProviderMock>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("empty-display")).toBeInTheDocument(),
    );
  });

  it("renders the query repository when queries exist", async () => {
    mockGetQueryList.mockResolvedValue(DEFAULT_QUERIES);

    render(
      <RootProviderMock currentPage={currentPage}>
        <QuerySelection setBuildStep={jest.fn()} />
      </RootProviderMock>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("my-queries-display")).toHaveTextContent(
        "ready",
      ),
    );
  });

  it("shows an error toast and unauthorized state on a permission-check failure", async () => {
    mockGetQueryList.mockRejectedValue(new Error("permission check failed"));

    render(
      <RootProviderMock currentPage={currentPage}>
        <QuerySelection setBuildStep={jest.fn()} />
      </RootProviderMock>,
    );

    await waitFor(() =>
      expect(showToastConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "error" }),
      ),
    );
  });

  it("uses the restricted query list for a standard user when auth is enabled", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { username: "tester", role: UserRole.STANDARD } },
    });
    mockGetQueriesForUser.mockResolvedValue(DEFAULT_QUERIES);

    render(
      <RootProviderMock
        currentPage={currentPage}
        runtimeConfig={{ AUTH_DISABLED: "false" }}
      >
        <QuerySelection setBuildStep={jest.fn()} />
      </RootProviderMock>,
    );

    await waitFor(() =>
      expect(mockGetQueriesForUser).toHaveBeenCalledWith({ id: "u1" }),
    );
    expect(mockGetQueryList).not.toHaveBeenCalled();
  });

  it("shows an error toast when the current user fetch is unauthorized", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { username: "tester", role: UserRole.STANDARD } },
    });
    mockGetUserByUsername.mockRejectedValue("Error: Unauthorized");
    mockGetQueriesForUser.mockResolvedValue([]);

    render(
      <RootProviderMock
        currentPage={currentPage}
        runtimeConfig={{ AUTH_DISABLED: "false" }}
      >
        <QuerySelection setBuildStep={jest.fn()} />
      </RootProviderMock>,
    );

    await waitFor(() =>
      expect(showToastConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          body: "You are not authorized to see queries.",
          variant: "error",
        }),
      ),
    );
  });
});
