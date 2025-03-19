import { screen, within, waitFor } from "@testing-library/react";
import AuditLogs from "./page";
import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import { UserEvent } from "@testing-library/user-event";

const TEST_NAME = "Rocky Balboa";
const TEST_REPORT = "Created Report";

/**
 * Helper function to select an option in a dropdown
 * @param user - The user event from renderWithUser
 * @param label - The label of the dropdown
 * @param value - The value of the option to select
 */
const selectDropdownOption = async (
  user: UserEvent,
  label: string,
  value: string,
) => {
  const select = screen.getByLabelText(label);
  await user.selectOptions(select, value);
};

/**
 * Helper function to input text in a field
 * @param user - The user event from renderWithUser
 * @param placeholder - The placeholder of the input field
 * @param text - The text to input
 */
const typeInField = async (
  user: UserEvent,
  placeholder: string,
  text: string,
) => {
  const input = screen.getByPlaceholderText(placeholder);
  await user.type(input, text);
};

describe("AuditLogs Component", () => {
  let user: UserEvent;

  beforeEach(() => {
    const renderResult = renderWithUser(
      <RootProviderMock currentPage="/auditLogs">
        <AuditLogs />
      </RootProviderMock>,
    );
    user = renderResult.user;
  });

  test("renders the audit logs table", async () => {
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
  });

  test("filters by name and clears filter", async () => {
    await selectDropdownOption(user, "Name(s)", TEST_NAME);

    const rows = await screen.findAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
    rows.slice(1).forEach((row) => {
      expect(within(row).getByText(TEST_NAME)).toBeInTheDocument();
    });

    await selectDropdownOption(user, "Name(s)", "");

    await waitFor(() => {
      expect(screen.getAllByRole("row").length).toBeGreaterThan(1);
    });
  });

  test("filters by action and clears filter", async () => {
    await selectDropdownOption(user, "Action(s)", TEST_REPORT);

    const rows = await screen.findAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
    rows.slice(1).forEach((row) => {
      expect(within(row).getByText(TEST_REPORT)).toBeInTheDocument();
    });

    await selectDropdownOption(user, "Action(s)", "");

    await waitFor(() => {
      expect(screen.getAllByRole("row").length).toBeGreaterThan(1);
    });
  });

  test("filters by partial search", async () => {
    await typeInField(user, "Search name or action", TEST_NAME);

    const rows = await screen.findAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
    rows.slice(1).forEach((row) => {
      expect(within(row).getByText(TEST_NAME)).toBeInTheDocument();
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
    await selectDropdownOption(user, "Actions per page", "25");

    await waitFor(() => {
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBe(26); // 25 logs + 1 header row
    });
  });

  test("clear filters resets empty state", async () => {
    // there is no Apollo Creed with Created Report; will need to come up with a different test
    await selectDropdownOption(user, "Name(s)", "Apollo Creed");
    await selectDropdownOption(user, "Action(s)", TEST_REPORT);

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
});
