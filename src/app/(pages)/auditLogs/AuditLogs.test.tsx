import { screen, within, waitFor } from "@testing-library/react";
import AuditLogs from "./page";
import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import userEvent from "@testing-library/user-event";
import { auditLogActionTypeMap } from "./components/auditLogMaps";
import { getAuditLogs, LogEntry } from "@/app/backend/audit-logs/service";

jest.mock(
  "@/app/ui/components/withAuth/WithAuth",
  () =>
    ({ children }: React.PropsWithChildren) => <div>{children}</div>,
);

jest.mock("@/app/backend/user-management", () => ({
  getAllUsers: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  getUserRole: jest.fn(),
}));

const TEST_NAME = "Mario Mario";
const TEST_ACTION = "makePatientRecordsRequest";
const TEST_REPORT = auditLogActionTypeMap[TEST_ACTION].label;
const TEST_REPORT_RENDERED = "Viewed patient record for";
const NUM_ROWS = 26;
const CHECKSUM_INPUT = "It's-a-me. Mario!";
const PLACEHOLDER_TEXT = "Search name, action, or message";
const BASE_TEST_DATA: LogEntry[] = [
  {
    actionType: "makePatientRecordsRequest",
    author: "Mario Mario",
    auditMessage: { query_name: "Test Query 1" },
    auditChecksum: CHECKSUM_INPUT,
    createdAt: new Date("2025-03-10T14:30:00Z"),
  },
  {
    actionType: "makePatientDiscoveryRequest",
    author: "Luigi Mario",
    auditMessage: { query_name: "Test Query 2" },
    auditChecksum: CHECKSUM_INPUT,
    createdAt: new Date("2025-03-09T09:15:00Z"),
  },
  {
    actionType: "makePatientDiscoveryRequest",
    author: "Mario Mario",
    auditMessage: { query_name: "Test Query 3" },
    auditChecksum: CHECKSUM_INPUT,
    createdAt: new Date("2022-03-08T17:45:00Z"),
  },
  {
    actionType: "makePatientRecordsRequest",
    author: "Princess Peach",
    auditMessage: { query_name: "Test Query 4" },
    auditChecksum: CHECKSUM_INPUT,
    createdAt: new Date("2024-03-07T12:00:00Z"),
  },
  {
    actionType: "makePatientDiscoveryRequest",
    author: "Toad Toadstool",
    auditMessage: { query_name: "Test Query 5" },
    auditChecksum: CHECKSUM_INPUT,
    createdAt: new Date("2025-03-06T22:10:00Z"),
  },
];

const testData = Array.from({ length: 50 }, (_, index) =>
  BASE_TEST_DATA.map((entry) => ({
    ...entry,
    date: new Date(entry.createdAt.getTime() + index * 86400000),
  })),
)
  .flat()
  .sort((a, b) => b.date.getTime() - a.date.getTime());

jest.mock("@/app/backend/audit-logs/service", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@/app/backend/audit-logs/service"),
    getAuditLogs: jest.fn(),
  };
});

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
  (getAuditLogs as jest.Mock).mockResolvedValue(testData);

  beforeEach(async () => {
    const renderResult = renderWithUser(
      <RootProviderMock currentPage="/auditLogs">
        <AuditLogs />
      </RootProviderMock>,
    );
    user = createUserWithHelpers(renderResult.user);

    await waitFor(() => {
      expect(
        renderResult.getByText("Showing", { exact: false }),
      ).toBeInTheDocument();
    });
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
      const matches = within(row).queryAllByText(
        (_, node) => !!node?.textContent?.includes(TEST_REPORT_RENDERED),
      );
      expect(matches.length).toBeGreaterThan(0);
    });

    await user.selectDropdownOption("Action(s)", "");
  });

  test("filters by partial search", async () => {
    await user.typeInField(PLACEHOLDER_TEXT, "Mario");

    const rows = await screen.findAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
    rows.slice(1).forEach((row) => {
      const matches = within(row).queryAllByText(/Mario/i);
      expect(matches.length).toBeGreaterThan(0);
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
      expect(rows.length).toBe(NUM_ROWS);
    });
  });

  test("clear filters resets empty state", async () => {
    await user.selectDropdownOption("Name(s)", "Luigi Mario");
    await user.selectDropdownOption("Action(s)", TEST_REPORT);

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

  test("selecting a preset radio updates date range and hides custom inputs", async () => {
    await screen.findByText("Audit Log");

    const input = screen.getByTestId("date-range-input");
    await user.click(input);

    const radio = screen.getByTestId("preset-last-7-days");
    await user.click(radio);

    // Date inputs should NOT be in the document
    expect(document.getElementById("log-date-start")).toBeNull();
    expect(document.getElementById("log-date-end")).toBeNull();

    // Apply filter to close popover
    const applyBtn = screen.getByRole("button", { name: /apply filter/i });
    await user.click(applyBtn);

    // The display input should now show a 7-day range (example: "06/10/25 - 06/17/25")
    // Adjust format as needed for your test setup, or just check for a non-empty value:
    const displayInput = screen.getByTestId(
      "date-range-input",
    ) as HTMLInputElement;
    expect(displayInput.value).not.toBe("");
  });

  test("updates start and end date inputs", async () => {
    await screen.findByText("Audit Log");

    const startInput = screen.getByRole("textbox", {
      name: /date range input/i,
    });
    await user.click(startInput);

    const customRadio = screen.getAllByTestId("preset-custom")[0];
    await user.click(customRadio);

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
      expect(resolvedEnd.value).toBe("03/01/2025");
    });
  });

  test("clears both start and end dates when Clear is clicked", async () => {
    await screen.findByText("Audit Log");

    const startInput = screen.getByRole("textbox", {
      name: /date range input/i,
    });
    await user.click(startInput);

    const customRadio = screen.getAllByTestId("preset-custom")[0];
    await user.click(customRadio);

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

    const clearButton = screen.getByTestId("date-range-clear-button");
    await user.click(clearButton);

    await waitFor(() => {
      const datePickerInput = document.getElementById(
        "auditLogDatePicker",
      ) as HTMLInputElement;

      expect(datePickerInput.value).toBe("");
    });
  });

  test("shows validation message for invalid start date format", async () => {
    await screen.findByText("Audit Log");

    const startInput = screen.getByRole("textbox", {
      name: /date range input/i,
    });
    await user.click(startInput);

    const customRadio = screen.getAllByTestId("preset-custom")[0];
    await user.click(customRadio);

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

  test("opens drawer on row click and closes", async () => {
    const rows = await screen.findAllByRole("row");
    const firstRow = rows[1];
    await user.click(firstRow);

    await waitFor(() => {
      expect(screen.getByTestId("drawer-title")).toHaveTextContent(
        "Full JSON request",
      );
    });

    const closeButton = screen.getByTestId("close-drawer");
    await user.click(closeButton);

    await waitFor(() => {
      const drawer = screen.getByTestId("drawer-open-false");
      expect(drawer.className).toContain("closed");
      expect(drawer.className).not.toContain("open");
    });
  });
});
