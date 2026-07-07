import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import DateRangePicker, {
  DateRangePickerRef,
  DEFAULT_DATE_DISPLAY_TEXT,
  formatDateRangeToMMDDYY,
  matchTimeRangeToOptionValue,
} from "./DateRangePicker";

const PICKER_ID = "test-date-picker";

/**
 * Helper to render the picker with sensible defaults.
 * @param overrides - props to override the defaults
 * @returns render result plus a stable onChange mock
 */
function renderPicker(
  overrides: Partial<React.ComponentProps<typeof DateRangePicker>> = {},
) {
  const onChange = jest.fn();
  const utils = render(
    <DateRangePicker
      id={PICKER_ID}
      startDate={null}
      endDate={null}
      isRelativeRange={false}
      onChange={onChange}
      {...overrides}
    />,
  );
  return { ...utils, onChange };
}

describe("formatDateRangeToMMDDYY", () => {
  it("formats a start and end date as MM/DD/YY - MM/DD/YY", () => {
    const start = new Date(2024, 0, 15);
    const end = new Date(2024, 2, 1);
    expect(formatDateRangeToMMDDYY(start, end)).toBe("01/15/24 - 03/01/24");
  });

  it("returns undefined when either date is missing", () => {
    expect(
      formatDateRangeToMMDDYY(new Date(2024, 0, 15), null),
    ).toBeUndefined();
    expect(formatDateRangeToMMDDYY(null, null)).toBeUndefined();
  });
});

describe("matchTimeRangeToOptionValue", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("matches a relative range to its preset value/label", () => {
    // "Last 7 days" preset computed against the frozen clock
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);

    const result = matchTimeRangeToOptionValue(start, end, true);
    expect(result.value).toBe("last-7-days");
    expect(result.label).toBe("Last 7 days");
    expect(result.isPreset).toBe(true);
  });

  it("returns an empty value for a relative range that matches no preset", () => {
    const start = new Date(2020, 0, 1);
    const end = new Date(2020, 0, 5);
    const result = matchTimeRangeToOptionValue(start, end, true);
    expect(result.value).toBe("");
  });

  it("is not a preset when the range is not relative", () => {
    const start = new Date(2020, 0, 1);
    const end = new Date(2020, 0, 5);
    const result = matchTimeRangeToOptionValue(start, end, false);
    expect(result.isPreset).toBe(false);
    expect(result.label).toBe(DEFAULT_DATE_DISPLAY_TEXT);
  });
});

describe("DateRangePicker component", () => {
  it("renders the default display text and placeholder", () => {
    renderPicker({ placeholderText: "Pick a range" });
    const input = screen.getByTestId(PICKER_ID) as HTMLInputElement;
    expect(input.value).toBe(DEFAULT_DATE_DISPLAY_TEXT);
    expect(input).toHaveAttribute("placeholder", "Pick a range");
  });

  it("opens the popover and lists the preset options", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByTestId(PICKER_ID));

    expect(screen.getByTestId("preset-last-7-days")).toBeInTheDocument();
    expect(screen.getByTestId("preset-absolute")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /apply filter/i }),
    ).toBeDisabled();
  });

  it("selecting a preset updates the display and enables Apply, which fires onChange", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker();

    await user.click(screen.getByTestId(PICKER_ID));
    await user.click(screen.getByTestId("preset-last-7-days"));

    // No absolute date inputs for a relative preset
    expect(document.getElementById("log-date-start")).toBeNull();

    const applyBtn = screen.getByRole("button", { name: /apply filter/i });
    expect(applyBtn).toBeEnabled();
    await user.click(applyBtn);

    expect(onChange).toHaveBeenCalled();
    // Popover closed after apply
    expect(screen.queryByTestId("preset-last-7-days")).not.toBeInTheDocument();

    const input = screen.getByTestId(PICKER_ID) as HTMLInputElement;
    expect(input.value).toBe("Last 7 days");
  });

  it("shows absolute date inputs and accepts valid start/end dates", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByTestId(PICKER_ID));
    await user.click(screen.getByTestId("preset-absolute"));

    const start = document.getElementById("log-date-start") as HTMLInputElement;
    const end = document.getElementById("log-date-end") as HTMLInputElement;
    expect(start).toBeInTheDocument();
    expect(end).toBeInTheDocument();

    await user.clear(start);
    await user.type(start, "02/28/2025");
    await user.clear(end);
    await user.type(end, "03/01/2025");

    await waitFor(() => {
      expect(start.value).toBe("02/28/2025");
      expect(end.value).toBe("03/01/2025");
    });
    // no validation error for a valid ascending range
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a validation error when the start date is after the end date", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByTestId(PICKER_ID));
    await user.click(screen.getByTestId("preset-absolute"));

    const start = document.getElementById("log-date-start") as HTMLInputElement;
    const end = document.getElementById("log-date-end") as HTMLInputElement;

    await user.clear(end);
    await user.type(end, "01/01/2025");
    await user.clear(start);
    await user.type(start, "03/01/2025");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Start date cannot be after end date.",
      );
    });
  });

  it("shows a validation error for an invalid start date format", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByTestId(PICKER_ID));
    await user.click(screen.getByTestId("preset-absolute"));

    const start = document.getElementById("log-date-start") as HTMLInputElement;
    await user.clear(start);
    await user.type(start, "not-a-date");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid start date format",
      );
    });
  });

  it("clears the selection and invokes handleClear", async () => {
    const user = userEvent.setup();
    const handleClear = jest.fn().mockResolvedValue(undefined);
    renderPicker({ handleClear });

    await user.click(screen.getByTestId(PICKER_ID));
    await user.click(screen.getByTestId("preset-last-30-days"));

    let input = screen.getByTestId(PICKER_ID) as HTMLInputElement;
    expect(input.value).toBe("Last 30 days");

    await user.click(screen.getByTestId("date-range-clear-button"));

    expect(handleClear).toHaveBeenCalled();
    input = screen.getByTestId(PICKER_ID) as HTMLInputElement;
    await waitFor(() => expect(input.value).toBe(DEFAULT_DATE_DISPLAY_TEXT));
  });

  it("closes the popover when clicking outside", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByTestId(PICKER_ID));
    expect(screen.getByTestId("preset-last-7-days")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    await waitFor(() =>
      expect(
        screen.queryByTestId("preset-last-7-days"),
      ).not.toBeInTheDocument(),
    );
  });

  it("exposes start/end/relative values through its ref", async () => {
    const user = userEvent.setup();
    const ref = createRef<DateRangePickerRef>();
    render(
      <DateRangePicker
        ref={ref}
        id={PICKER_ID}
        startDate={null}
        endDate={null}
        isRelativeRange={false}
        onChange={jest.fn()}
      />,
    );

    await user.click(screen.getByTestId(PICKER_ID));
    await user.click(screen.getByTestId("preset-last-7-days"));

    expect(ref.current?.getIsRelativeRange()).toBe(true);
    expect(ref.current?.getStartDate()).toBeInstanceOf(Date);
    expect(ref.current?.getEndDate()).toBeInstanceOf(Date);
  });

  describe("initial props hydration", () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("hydrates the display text from a matching relative preset", () => {
      const end = new Date();
      end.setHours(0, 0, 0, 0);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);

      render(
        <DateRangePicker
          id={PICKER_ID}
          startDate={start}
          endDate={end}
          isRelativeRange={true}
          onChange={jest.fn()}
        />,
      );

      const input = screen.getByTestId(PICKER_ID) as HTMLInputElement;
      expect(input.value).toBe("Last 7 days");
    });

    it("hydrates a custom absolute range as a formatted MM/DD/YY label", () => {
      const start = new Date(2020, 0, 1);
      const end = new Date(2020, 0, 5);

      render(
        <DateRangePicker
          id={PICKER_ID}
          startDate={start}
          endDate={end}
          isRelativeRange={false}
          onChange={jest.fn()}
        />,
      );

      const input = screen.getByTestId(PICKER_ID) as HTMLInputElement;
      expect(input.value).toBe("01/01/20 - 01/05/20");
    });
  });
});
