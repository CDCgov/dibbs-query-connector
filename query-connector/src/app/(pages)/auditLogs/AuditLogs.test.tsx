import { screen, within, waitFor } from "@testing-library/react";
import AuditLogs from "./page";
import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import userEvent from "@testing-library/user-event";

const TEST_NAME = "Rocky Balboa";
const TEST_REPORT = "Created Report";

/**
 * Creates an enhanced user event with custom helper methods.
 * @param user - The user event from renderWithUser
 * @returns - The enhanced user event object with custom helpers
 */
const createUserWithHelpers = (user: ReturnType<typeof userEvent.setup>) => ({
  ...user,

  /**
   * Selects an option in a dropdown.
   * @param label - The label of the dropdown
   * @param value - The value of the option to select
   */
  async selectDropdownOption(label: string, value: string) {
    const select = screen.getByLabelText(label);
    await user.selectOptions(select, value);
  },

  /**
   * Inputs text in a field.
   * @param placeholder - The placeholder of the input field
   * @param text - The text to input
   */
  async typeInField(placeholder: string, text: string) {
    const input = screen.getByPlaceholderText(placeholder);
    await user.type(input, text);
  },
});

describe("AuditLogs Component", () => {
  let user: ReturnType<typeof createUserWithHelpers>;

  beforeEach(() => {
    const renderResult = renderWithUser(
      <RootProviderMock currentPage="/auditLogs">
        <AuditLogs />
      </RootProviderMock>,
    );
    user = createUserWithHelpers(renderResult.user);
  });

  test("renders the audit logs table", async () => {
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
  });

  test("filters by name and clears filter", async () => {
    await user.selectDropdownOption("Name(s)", TEST_NAME);

    const rows = await screen.findAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
    rows.slice(1).forEach((row) => {
      expect(within(row).getByText(TEST_NAME)).toBeInTheDocument();
    });

    await user.selectDropdownOption("Name(s)", "");
  });

  test("filters by action and clears filter", async () => {
    await user.selectDropdownOption("Action(s)", TEST_REPORT);

    const rows = await screen.findAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
    rows.slice(1).forEach((row) => {
      expect(within(row).getByText(TEST_REPORT)).toBeInTheDocument();
    });

    await user.selectDropdownOption("Action(s)", "");
  });

  test("filters by partial search", async () => {
    await user.typeInField("Search name or action", "Apollo");

    const rows = await screen.findAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
    rows.slice(1).forEach((row) => {
      expect(within(row).getByText(/Apollo/i)).toBeInTheDocument();
    });
  });

  test("pagination updates displayed logs", async () => {
    const nextButton = screen.getByLabelText("Next page");
    expect(nextButton).toBeInTheDocument();
    await user.click(nextButton);

    await waitFor(() => {
      const pageNumbers = screen.getAllByRole("button", { name: /Page/ });
      expect(pageNumbers[1]).toHaveAttribute("aria-current", "page");
    });
  });

  test("pagination allows clicking previous only if it exists", async () => {
    const nextButton = screen.getByLabelText("Next page");
    expect(nextButton).toBeInTheDocument();
    await user.click(nextButton);

    // Ensure previous button appears after going to the second page
    await waitFor(async () => {
      const prevButton = screen.getByLabelText("Previous page");
      expect(prevButton).toBeInTheDocument();
      await user.click(prevButton);
    });
  });

  test("pagination allows clicking a specific page number", async () => {
    const pageTwoButton = screen.getByRole("button", { name: "Page 2" });

    await user.click(pageTwoButton);

    await waitFor(() => {
      expect(pageTwoButton).toHaveAttribute("aria-current", "page");
    });
  });

  test("changing actions per page updates table", async () => {
    await user.selectDropdownOption("Actions per page", "25");

    await waitFor(() => {
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBe(26);
    });
  });

  test("clear filters resets empty state", async () => {
    await user.selectDropdownOption("Name(s)", "Apollo Creed");
    await user.selectDropdownOption("Action(s)", "Created Report");

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Clear filters" }),
      ).toBeInTheDocument();
    });

    const clearFiltersButton = screen.getByRole("button", {
      name: "Clear filters",
    });
    await user.click(clearFiltersButton);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });

  test("updates start and end date inputs", async () => {
    await screen.findByText("Audit Log");

    const startInput = screen.getByRole("textbox", {
      name: /date range input/i,
    });
    await user.click(startInput);

    const resolvedStart = document.getElementById(
      "log-date-start",
    ) as HTMLInputElement;
    const resolvedEnd = document.getElementById(
      "log-date-end",
    ) as HTMLInputElement;

    expect(resolvedStart).toBeInTheDocument();
    expect(resolvedEnd).toBeInTheDocument();

    await user.clear(resolvedStart);
    await user.type(resolvedStart, "02/28/2025");

    await user.clear(resolvedEnd);
    await user.type(resolvedEnd, "03/01/2025");

    await waitFor(() => {
      expect(resolvedStart.value).toBe("2/28/2025");
      expect(resolvedEnd.value).toBe("3/1/2025");
    });
  });

  test("clears both start and end dates when Clear is clicked", async () => {
    await screen.findByText("Audit Log");

    const input = screen.getByRole("textbox", { name: /date range input/i });
    await user.click(input);

    const resolvedStart = document.getElementById(
      "log-date-start",
    ) as HTMLInputElement;
    const resolvedEnd = document.getElementById(
      "log-date-end",
    ) as HTMLInputElement;

    await user.clear(resolvedStart);
    await user.type(resolvedStart, "02/28/2025");

    await user.clear(resolvedEnd);
    await user.type(resolvedEnd, "03/01/2025");

    console.log("resolvedStart.value", resolvedStart.value);
    console.log("resolvedEnd.value", resolvedEnd.value);

    const clearButton = screen.getByTestId("date-range-clear-button");
    await user.click(clearButton);

    await waitFor(() => {
      expect(resolvedStart.value).toBe("");
      expect(resolvedEnd.value).toBe("");
    });
  });

  test("shows validation message for invalid start date format", async () => {
    await screen.findByText("Audit Log");

    const startInput = screen.getByRole("textbox", {
      name: /date range input/i,
    });
    await user.click(startInput);

    const resolvedStart = document.getElementById(
      "log-date-start",
    ) as HTMLInputElement;
    const resolvedEnd = document.getElementById(
      "log-date-end",
    ) as HTMLInputElement;

    await user.clear(resolvedStart);
    await user.type(resolvedStart, "invalid-date");

    await user.clear(resolvedEnd);
    await user.type(resolvedEnd, "03/01/2025");

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Invalid start date format");
    });
  });
});
