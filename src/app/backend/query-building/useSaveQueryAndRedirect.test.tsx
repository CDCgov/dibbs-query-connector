import { screen, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import { useSaveQueryAndRedirect } from "./useSaveQueryAndRedirect";
import { saveCustomQuery, getCustomQueries } from "./service";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import {
  MedicalRecordSections,
  NestedQuery,
} from "@/app/(pages)/queryBuilding/utils";
import { SelectedQueryDetails } from "@/app/(pages)/queryBuilding/querySelection/utils";

jest.mock("next-auth/react");

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, prefetch: jest.fn() }),
}));

jest.mock("./service", () => ({
  saveCustomQuery: jest.fn(),
  getCustomQueries: jest.fn(),
}));

jest.mock("@/app/ui/designSystem/toast/Toast", () => ({
  showToastConfirmation: jest.fn(),
}));

const CONSTRUCTED_QUERY = {} as unknown as NestedQuery;
const MEDICAL_RECORD_SECTIONS = {} as unknown as MedicalRecordSections;

type ProbeProps = {
  newQueryName?: string;
  redirectPath?: string;
  pageMode?: string;
};

const SaveProbe: React.FC<ProbeProps> = ({
  newQueryName,
  redirectPath = "/next",
  pageMode,
}) => {
  const saveQueryAndRedirect = useSaveQueryAndRedirect();
  return (
    <button
      onClick={() =>
        saveQueryAndRedirect(
          CONSTRUCTED_QUERY,
          MEDICAL_RECORD_SECTIONS,
          newQueryName,
          redirectPath,
          pageMode,
        )
      }
    >
      save
    </button>
  );
};

const renderProbe = (
  props: ProbeProps,
  opts: { setData?: jest.Mock; initialQuery?: SelectedQueryDetails } = {},
) =>
  renderWithUser(
    <RootProviderMock
      currentPage="/queryBuilding"
      setData={opts.setData}
      initialQuery={opts.initialQuery}
    >
      <SaveProbe {...props} />
    </RootProviderMock>,
  );

const setLoggedIn = (username?: string) =>
  (useSession as jest.Mock).mockReturnValue({
    data: username ? { user: { username } } : undefined,
    status: username ? "authenticated" : "unauthenticated",
  });

describe("useSaveQueryAndRedirect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("bails out and logs an error when the username is missing", async () => {
    setLoggedIn(undefined);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { user } = renderProbe({ newQueryName: "My Query" });
    await user.click(screen.getByText("save"));

    expect(errorSpy).toHaveBeenCalledWith("Missing username or queryName.");
    expect(saveCustomQuery).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("bails out when no query name can be resolved", async () => {
    setLoggedIn("harrypotter");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // No newQueryName and no selectedQuery.queryName in context
    const { user } = renderProbe({ newQueryName: undefined });
    await user.click(screen.getByText("save"));

    expect(errorSpy).toHaveBeenCalledWith("Missing username or queryName.");
    expect(saveCustomQuery).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("saves the query, refreshes data, and redirects on success", async () => {
    setLoggedIn("harrypotter");
    (saveCustomQuery as jest.Mock).mockResolvedValue([{ id: "new-query-id" }]);
    const refreshedQueries = [{ queryId: "new-query-id" }];
    (getCustomQueries as jest.Mock).mockResolvedValue(refreshedQueries);
    const setData = jest.fn();

    const { user } = renderProbe(
      {
        newQueryName: "My New Query",
        redirectPath: "/queryBuilding/success",
        pageMode: "edit",
      },
      {
        setData,
        initialQuery: {
          queryId: "existing-id",
          queryName: "",
        } as SelectedQueryDetails,
      },
    );

    await user.click(screen.getByText("save"));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/queryBuilding/success"),
    );
    expect(saveCustomQuery).toHaveBeenCalledWith(
      CONSTRUCTED_QUERY,
      MEDICAL_RECORD_SECTIONS,
      "My New Query",
      "harrypotter",
      "existing-id",
    );
    expect(getCustomQueries).toHaveBeenCalled();
    expect(setData).toHaveBeenCalledWith(refreshedQueries);
    expect(showToastConfirmation).not.toHaveBeenCalled();
  });

  it("falls back to the context query name when no new name is given", async () => {
    setLoggedIn("harrypotter");
    (saveCustomQuery as jest.Mock).mockResolvedValue([{ id: "ctx-id" }]);
    (getCustomQueries as jest.Mock).mockResolvedValue([]);

    const { user } = renderProbe(
      { newQueryName: undefined, redirectPath: "/done" },
      {
        initialQuery: {
          queryId: "ctx-existing",
          queryName: "Context Query",
        } as SelectedQueryDetails,
      },
    );

    await user.click(screen.getByText("save"));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/done"));
    expect(saveCustomQuery).toHaveBeenCalledWith(
      CONSTRUCTED_QUERY,
      MEDICAL_RECORD_SECTIONS,
      "Context Query",
      "harrypotter",
      "ctx-existing",
    );
  });

  it("shows an error toast when saving returns no id", async () => {
    setLoggedIn("harrypotter");
    // Resolve an error-shaped value (no id) rather than rejecting
    (saveCustomQuery as jest.Mock).mockResolvedValue([{}]);

    const { user } = renderProbe({ newQueryName: "Doomed Query" });
    await user.click(screen.getByText("save"));

    await waitFor(() =>
      expect(showToastConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          heading: "Something went wrong",
          variant: "error",
        }),
      ),
    );
    expect(getCustomQueries).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
