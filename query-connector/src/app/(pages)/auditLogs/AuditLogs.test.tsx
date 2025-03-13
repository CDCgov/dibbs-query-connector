import { render, screen, fireEvent, within } from "@testing-library/react";
import AuditLogs from "./page";
import userEvent from "@testing-library/user-event";

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

  test("renders the audit logs table", () => {
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  test("filters by name", async () => {
    await selectDropdownOption("Name(s)", "Rocky Balboa");

    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(1); // Ensuring at least header + 1 row
    rows.slice(1).forEach((row) => {
      expect(within(row).getByText("Rocky Balboa")).toBeInTheDocument();
    });
  });

  test("filters by action", async () => {
    await selectDropdownOption("Action(s)", "Created Report");

    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
    rows.slice(1).forEach((row) => {
      expect(within(row).getByText("Created Report")).toBeInTheDocument();
    });
  });

  // test("filters by date", async () => {
  //   const dateInput = screen.getByLabelText("Date");
  //   fireEvent.change(dateInput, { target: { value: "2025-03-10" } });

  //   const rows = screen.getAllByRole("row");
  //   expect(rows.length).toBeGreaterThan(1);
  //   rows.slice(1).forEach((row) => {
  //     expect(
  //       within(row).getByText((content) => content.includes("3/10/2025"))
  //     ).toBeInTheDocument();
  //   });
  // });

  test("filters by search field", async () => {
    await typeInField("Search name or action", "Apollo");

    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
    rows.slice(1).forEach((row) => {
      expect(within(row).getByText("Apollo Creed")).toBeInTheDocument();
    });
  });

  test("pagination updates displayed logs", async () => {
    const nextButton = screen.getByLabelText("Next page");
    expect(nextButton).toBeInTheDocument();

    fireEvent.click(nextButton);

    const pageNumbers = screen.getAllByRole("button", { name: /Page/ });
    expect(pageNumbers[1]).toHaveAttribute("aria-current", "page");
  });

  test("changing actions per page updates table", async () => {
    await selectDropdownOption("Actions per page", "25");

    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(26); // 25 logs + 1 header row
  });

  test("clearing filters resets results", async () => {
    await selectDropdownOption("Name(s)", "Apollo Creed");
    await selectDropdownOption("Name(s)", "");

    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
  });
});
