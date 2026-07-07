import { render, screen, waitFor } from "@testing-library/react";
import { renderWithUser } from "@/app/tests/unit/setup";
import { EmptyQueriesDisplay } from "./EmptyQueriesDisplay";
import { createDibbsDB } from "@/app/backend/db-creation/service";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { MISSING_API_KEY_LITERAL } from "@/app/constants";

jest.mock("@/app/backend/db-creation/service", () => ({
  createDibbsDB: jest.fn(),
}));

jest.mock("@/app/ui/designSystem/toast/Toast", () => ({
  showToastConfirmation: jest.fn(),
}));

const mockCreateDibbsDB = createDibbsDB as jest.Mock;
const mockToast = showToastConfirmation as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  (console.log as jest.Mock).mockRestore();
});

describe("EmptyQueriesDisplay", () => {
  it("renders the empty-state marketing copy and CTA button", () => {
    render(
      <EmptyQueriesDisplay
        dbSeeded={true}
        goForward={jest.fn()}
        setDbSeeded={jest.fn()}
      />,
    );

    expect(screen.getByTestId("empty-state-container")).toBeInTheDocument();
    expect(screen.getByText("Start with Query Builder")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Build your first query" }),
    ).toBeInTheDocument();
  });

  it("navigates forward without seeding when the DB is already seeded", async () => {
    const goForward = jest.fn();
    const setDbSeeded = jest.fn();
    const { user } = renderWithUser(
      <EmptyQueriesDisplay
        dbSeeded={true}
        goForward={goForward}
        setDbSeeded={setDbSeeded}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Build your first query" }),
    );

    expect(goForward).toHaveBeenCalledTimes(1);
    expect(mockCreateDibbsDB).not.toHaveBeenCalled();
  });

  it("shows the loading view while seeding, then reports success", async () => {
    let resolveCreate: (v: {
      success: boolean;
      message: string;
      cause?: string;
    }) => void = () => {};
    mockCreateDibbsDB.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    const setDbSeeded = jest.fn();

    const { user } = renderWithUser(
      <EmptyQueriesDisplay
        dbSeeded={false}
        goForward={jest.fn()}
        setDbSeeded={setDbSeeded}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Build your first query" }),
    );

    // loading view appears while the seeding promise is pending
    expect(
      await screen.findByText(/Setting up your workspace/i),
    ).toBeInTheDocument();

    resolveCreate({ success: true, message: "" });

    await waitFor(() => expect(setDbSeeded).toHaveBeenCalledWith(true));
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ heading: "Database seeding finished" }),
    );
    // back to the empty state once seeding resolves
    await waitFor(() =>
      expect(screen.getByTestId("empty-state-container")).toBeInTheDocument(),
    );
  });

  it("shows a generic error toast when seeding fails", async () => {
    mockCreateDibbsDB.mockResolvedValue({
      success: false,
      message: "boom",
    });
    const setDbSeeded = jest.fn();

    const { user } = renderWithUser(
      <EmptyQueriesDisplay
        dbSeeded={false}
        goForward={jest.fn()}
        setDbSeeded={setDbSeeded}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Build your first query" }),
    );

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          heading: "Something went wrong.",
          variant: "error",
        }),
      ),
    );
    // generic failure passes a plain string body
    expect(typeof mockToast.mock.calls[0][0].body).toBe("string");
    expect(mockToast.mock.calls[0][0].body).toContain("boom");
    expect(setDbSeeded).not.toHaveBeenCalled();
  });

  it("shows the API-key documentation link when the failure cause is a missing key", async () => {
    mockCreateDibbsDB.mockResolvedValue({
      success: false,
      message: "No API key configured",
      cause: MISSING_API_KEY_LITERAL,
    });

    const { user } = renderWithUser(
      <EmptyQueriesDisplay
        dbSeeded={false}
        goForward={jest.fn()}
        setDbSeeded={jest.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Build your first query" }),
    );

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          heading: "Something went wrong.",
          variant: "error",
        }),
      ),
    );
    // the missing-key branch passes a React node (the doc link), not a string
    expect(typeof mockToast.mock.calls[0][0].body).toBe("object");
  });
});
