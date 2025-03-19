import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
import AuditLogs from "./page";
import userEvent from "@testing-library/user-event";

jest.mock("@/app/ui/components/withAuth/WithAuth", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

/**
 * Helper function to select an option in a dropdown
 * @param label - The label of the dropdown
 * @param value - The value of the option to select
 */
const selectDropdownOption = async (label: string, value: string) => {
  const select = screen.getByLabelText(label);
  await userEvent.selectOptions(select, value);
};

/**
 * Helper function to input text in a field
 * @param placeholder - The placeholder of the input field
 * @param text - The text to input
 */
const typeInField = async (placeholder: string, text: string) => {
  const input = screen.getByPlaceholderText(placeholder);
  await userEvent.type(input, text);
};

describe("AuditLogs Component", () => {
  beforeEach(() => {
    render(<AuditLogs />);
  });

  test("renders the audit logs table", async () => {
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
  });

  test("filters by name and clears filter", async () => {
    await selectDropdownOption("Name(s)", "Rocky Balboa");

    const rows = await screen.findAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
    rows.slice(1).forEach((row) => {
      expect(within(row).getByText("Rocky Balboa")).toBeInTheDocument();
    });

    await selectDropdownOption("Name(s)", "");

    await waitFor(() => {
      expect(screen.getAllByRole("row").length).toBeGreaterThan(1);
    });
  });

  test("filters by action and clears filter", async () => {
    await selectDropdownOption("Action(s)", "Created Report");

    const rows = await screen.findAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
    rows.slice(1).forEach((row) => {
      expect(within(row).getByText("Created Report")).toBeInTheDocument();
    });

    await selectDropdownOption("Action(s)", "");

    await waitFor(() => {
      expect(screen.getAllByRole("row").length).toBeGreaterThan(1);
    });
  });

  test("filters by partial search", async () => {
    await typeInField("Search name or action", "Apollo");

    const rows = await screen.findAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
    rows.slice(1).forEach((row) => {
      expect(within(row).getByText(/Apollo/i)).toBeInTheDocument();
    });
  });

  test("pagination updates displayed logs", async () => {
    const nextButton = screen.getByLabelText("Next page");
    expect(nextButton).toBeInTheDocument();
    fireEvent.click(nextButton);

    await waitFor(() => {
      const pageNumbers = screen.getAllByRole("button", { name: /Page/ });
      expect(pageNumbers[1]).toHaveAttribute("aria-current", "page");
    });
  });

  test("pagination allows clicking previous only if it exists", async () => {
    const nextButton = screen.getByLabelText("Next page");
    expect(nextButton).toBeInTheDocument();
    fireEvent.click(nextButton);

    // Ensure previous button appears after going to the second page
    await waitFor(() => {
      const prevButton = screen.getByLabelText("Previous page");
      expect(prevButton).toBeInTheDocument();
      fireEvent.click(prevButton);
    });
  });

  test("pagination allows clicking a specific page number", async () => {
    const pageTwoButton = screen.getByRole("button", { name: "Page 2" });

    fireEvent.click(pageTwoButton);

    await waitFor(() => {
      expect(pageTwoButton).toHaveAttribute("aria-current", "page");
    });
  });

  test("changing actions per page updates table", async () => {
    await selectDropdownOption("Actions per page", "25");

    await waitFor(() => {
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBe(26); // 25 logs + 1 header row
    });
  });

  test("clear filters resets empty state", async () => {
    // there is no Apollo Creed with Created Report; will need to come up with a different test
    await selectDropdownOption("Name(s)", "Apollo Creed");
    await selectDropdownOption("Action(s)", "Created Report");
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Clear filters" }),
      ).toBeInTheDocument();
    });

    const clearFiltersButton = screen.getByRole("button", {
      name: "Clear filters",
    });
    fireEvent.click(clearFiltersButton);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });
});
