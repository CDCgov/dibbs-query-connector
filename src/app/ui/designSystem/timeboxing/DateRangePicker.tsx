"use client";

import {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  Button,
  DateRangePicker as USWDSDateRangePicker,
  Icon,
  TextInput,
  Radio,
  FormGroup,
} from "@trussworks/react-uswds";
import styles from "./DateRangePicker.module.scss";
import { addHours } from "date-fns";
import classNames from "classnames";

export interface DateRange {
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface DateRangeInfo extends DateRange {
  isRelativeRange: boolean;
}

export interface DateErrors {
  start?: string;
  end?: string;
}

// We probably can reuse this logic from the backend for whatever our fhir logic will be then just import it
const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

type PresetOptions = {
  label: string;
  value: string;
  getRange: () => DateRange;
};

const PRESET_TIMERANGE_OPTIONS: PresetOptions[] = [
  {
    label: "Last 24 hours",
    value: "last-day",
    getRange: () => {
      const end = new Date();
      const start = addHours(end, -24);
      return {
        startDate: start,
        endDate: end,
      };
    },
  },
  {
    label: "Last 7 days",
    value: "last-7-days",
    getRange: () => {
      const end = today();
      const start = addDays(end, -7);
      return {
        startDate: start,
        endDate: end,
      };
    },
  },
  {
    label: "Last 30 days",
    value: "last-30-days",
    getRange: () => {
      const end = today();
      const start = addDays(end, -30);
      return {
        startDate: start,
        endDate: end,
      };
    },
  },
  {
    label: "Last 3 months",
    value: "last-3-months",
    getRange: () => {
      const end = today();
      const start = addMonths(end, -3);
      return {
        startDate: start,
        endDate: end,
      };
    },
  },
  {
    label: "Last 6 months",
    value: "last-6-months",
    getRange: () => {
      const end = today();
      const start = addMonths(end, -6);
      return {
        startDate: start,
        endDate: end,
      };
    },
  },
  {
    label: "Last year",
    value: "last-year",
    getRange: () => {
      const end = today();
      const start = new Date(end);
      start.setFullYear(end.getFullYear() - 1);
      return {
        startDate: start,
        endDate: end,
      };
    },
  },
];

/**
 * @param initialStart - initial start date
 * @param  initialEnd - initial end date
 * @param  isRelativeRange - whether we know the range is relative
 * @returns value of the label to match to the preset option
 */
export function matchTimeRangeToOptionValue(
  initialStart: Date,
  initialEnd: Date,
  isRelativeRange: boolean,
): { value: string; label: string; isPreset: boolean } {
  let displayValue = "";
  let isPreset = isRelativeRange;
  let displayLabel = DEFAULT_DATE_DISPLAY_TEXT;

  isRelativeRange &&
    PRESET_TIMERANGE_OPTIONS.forEach((p) => {
      const { startDate, endDate } = p.getRange();
      if (
        areDatesOnSameDay(startDate, initialStart) &&
        areDatesOnSameDay(endDate, initialEnd)
      ) {
        displayValue = p.value;
        displayLabel = p.label;
        isPreset = true;
      }
    });
  return {
    value: displayValue,
    label: displayLabel,
    isPreset: isPreset,
  };
}

const ABSOLUTE_VALUE = "absolute";
const ABSOLUTE_DISPLAY_LABEL = "Absolute date range";

interface DateRangePickerProps {
  startDate: Date | null | undefined;
  endDate: Date | null | undefined;
  isRelativeRange: boolean;
  onChange: (...args: unknown[]) => void;
  id: string;
  handleClear?: () => Promise<void>;
  popoverSide?: "left" | "right";
  placeholderText?: string;
}

export type DateRangePickerRef = {
  getStartDate: () => Date | null | undefined;
  getEndDate: () => Date | null | undefined;
  getIsRelativeRange: () => boolean | null;
};

const DEFAULT_DATE_DISPLAY_TEXT = "All dates";
/**
 * A date range picker component with a toggleable modal and quick preset buttons.
 * @param root0 - The component props.
 * @param root0.startDate - The start date.
 * @param root0.endDate - The end date.
 * @param root0.id - The id for the form input.
 * @param root0.onChange - The change handler.
 * @param root0.isRelativeRange - whether the range is relative.
 * @param root0.popoverSide - Optional prop to control the side the popover's on.
 * @param root0.handleClear - Optional prop to control the side the popover's on.
 * @param root0.placeholderText - Text to indicate the filter.
 * @returns - The date range picker component.
 */

const DateRangePicker = forwardRef<DateRangePickerRef, DateRangePickerProps>(
  (
    {
      startDate: initialStart,
      endDate: initialEnd,
      isRelativeRange: initialIsRelative,
      onChange,
      id,
      handleClear,
      popoverSide = "right",
      placeholderText = "Filter by date",
    },
    ref,
  ) => {
    const [selectedPreset, setSelectedPreset] = useState<string>("");
    const [startDate, setStartDate] = useState<Date | null | undefined>(
      initialStart,
    );
    const [endDate, setEndDate] = useState<Date | null | undefined>(initialEnd);
    const [isRelativeRange, setIsRelativeRange] =
      useState<boolean>(initialIsRelative);

    const [dateErrors, setDateErrors] = useState<DateErrors>({});
    const [isOpen, setIsOpen] = useState(false);
    const [displayText, setDisplayText] = useState(DEFAULT_DATE_DISPLAY_TEXT);

    const containerRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => ({
      // these hooks are available through the ref in the onChange value passed in
      getStartDate: () => startDate,
      getEndDate: () => endDate,
      getIsRelativeRange: () => isRelativeRange,
    }));

    const validateDates = (
      newStartDate: Date | null | undefined,
      newEndDate: Date | null | undefined,
    ) => {
      const errors: DateErrors = {};

      if (newStartDate && isNaN(newStartDate.getTime())) {
        errors.start = "Invalid start date format. Use MM/DD/YYYY.";
      }
      if (newEndDate && isNaN(newEndDate.getTime())) {
        errors.end = "Invalid end date format. Use MM/DD/YYYY.";
      }
      if (newStartDate && newEndDate && newStartDate > newEndDate) {
        errors.start = "Start date cannot be after end date.";
        errors.end = "End date cannot be before start date.";
      }

      document
        .getElementById("log-date-start")
        ?.classList.toggle(styles.bgErrorLighter, !!errors.start);
      document
        .getElementById("log-date-start")
        ?.classList.toggle(styles.borderError, !!errors.start);
      document
        .getElementById("log-date-end")
        ?.classList.toggle(styles.bgErrorLighter, !!errors.end);
      document
        .getElementById("log-date-end")
        ?.classList.toggle(styles.borderError, !!errors.end);

      setDateErrors(errors);
      return errors;
    };

    const handlePresetChange = (value: string) => {
      setSelectedPreset(value);
      if (value !== ABSOLUTE_VALUE) {
        setDateErrors({});
      }
      setIsRelativeRange(value !== ABSOLUTE_VALUE);
    };

    const handleApply = () => {
      onChange();
      setIsOpen(false);
    };

    const handleClearClick = async () => {
      if (handleClear) {
        await handleClear();
      }
      setStartDate(null);
      setEndDate(null);
      setSelectedPreset("");
      setDateErrors({});
      setDisplayText(DEFAULT_DATE_DISPLAY_TEXT);
    };

    useEffect(() => {
      if (initialStart == null || initialEnd == null) return;

      const matchingValue = matchTimeRangeToOptionValue(
        initialStart,
        initialEnd,
        initialIsRelative,
      );
      if (matchingValue.isPreset) {
        setDisplayText(matchingValue.label);
        setSelectedPreset(matchingValue.value);
      } else {
        // we didn't hit a match but the start / end are defined, so we're in the custom value
        setStartDate(initialStart);
        setEndDate(initialEnd);
        setSelectedPreset(ABSOLUTE_VALUE);
        setDisplayText(
          formatDateRangeToMMDDYY(initialStart, initialEnd) ??
            ABSOLUTE_DISPLAY_LABEL,
        );
      }
    }, [initialStart, initialEnd, initialIsRelative]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      } else {
        document.removeEventListener("mousedown", handleClickOutside);
      }

      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
      if (!selectedPreset) {
        setDisplayText(DEFAULT_DATE_DISPLAY_TEXT);
      } else if (selectedPreset === ABSOLUTE_VALUE) {
        const displayDateRange =
          formatDateRangeToMMDDYY(startDate, endDate) ?? ABSOLUTE_DISPLAY_LABEL;
        setIsRelativeRange(false);
        setStartDate(startDate);
        setEndDate(endDate);
        setDisplayText(displayDateRange);
      } else {
        const selectedLabel =
          PRESET_TIMERANGE_OPTIONS.find((v) => v.value === selectedPreset)
            ?.label ?? "";

        const rangeValues = (
          PRESET_TIMERANGE_OPTIONS.find(
            (p) => p.value === selectedPreset,
          ) as PresetOptions
        ).getRange();

        setIsRelativeRange(true);
        setStartDate(rangeValues.startDate);
        setEndDate(rangeValues.endDate);
        setDisplayText(selectedLabel);
      }
    }, [selectedPreset]);

    const disableApply = !selectedPreset;
    console.log(isRelativeRange);

    return (
      <div className={styles.datePickerContainer} ref={containerRef}>
        <div className={classNames(styles.textInputContainer)}>
          <Icon.CalendarToday
            size={3}
            className={styles.calendarIcon}
            aria-label="date-range-calendar-icon"
          />
          <TextInput
            id={id}
            type="text"
            className={classNames(
              styles.dateRangeInput,
              !selectedPreset && styles.datePicker__narrow,
              selectedPreset &&
                selectedPreset !== ABSOLUTE_VALUE &&
                styles.datePicker,
              selectedPreset === ABSOLUTE_VALUE && styles.datePicker__wide,
            )}
            data-testid="date-range-input"
            name="date-range-input"
            aria-label="Date range input"
            value={displayText}
            readOnly
            placeholder={placeholderText}
            onClick={() => setIsOpen((prev) => !prev)}
          />
        </div>
        {isOpen && (
          <div
            className={classNames(
              styles.filterPopover,
              popoverSide === "left" ? styles.popoverLeft : styles.popoverRight,
            )}
          >
            <FormGroup className="margin-top-1">
              <fieldset className={styles.radioGroup} aria-label="Filter by">
                <div className="display-flex justify-between flex-align-baseline">
                  <legend className={styles.legend}>Filter by</legend>

                  <Button
                    unstyled
                    type="button"
                    data-testid="date-range-clear-button"
                    onClick={handleClearClick}
                  >
                    Clear
                  </Button>
                </div>

                {PRESET_TIMERANGE_OPTIONS.map(({ label, value }) => (
                  <Radio
                    key={value}
                    id={`preset-${value}`}
                    data-testid={`preset-${value}`}
                    aria-label={`Preset value ${value} radio button`}
                    name="date-filter"
                    label={label}
                    value={value}
                    checked={selectedPreset === value}
                    onChange={() => handlePresetChange(value)}
                  />
                ))}
                <hr className="margin-top-2"></hr>
                <Radio
                  id={`preset-${ABSOLUTE_VALUE}`}
                  name="date-filter"
                  label={ABSOLUTE_DISPLAY_LABEL}
                  data-testid={`preset-${ABSOLUTE_VALUE}`}
                  aria-label="Absolute date range radio button"
                  value={ABSOLUTE_VALUE}
                  checked={selectedPreset === ABSOLUTE_VALUE}
                  onChange={() => handlePresetChange(ABSOLUTE_VALUE)}
                />
              </fieldset>
            </FormGroup>

            <div className={styles.clearButtonContainer}></div>
            {selectedPreset === ABSOLUTE_VALUE && (
              <>
                <USWDSDateRangePicker
                  startDateLabel="Start Date"
                  endDateLabel="End Date"
                  aria-label="Date range picker"
                  startDatePickerProps={{
                    id: "log-date-start",
                    name: "log-date-start",
                    defaultValue: startDate ? startDate.toISOString() : "",
                    onChange: (val?: string) => {
                      const rawDate = val ? new Date(val) : null;
                      const date = rawDate;
                      const errors = validateDates(date, endDate);
                      setDateErrors(errors);
                      setStartDate(date);
                    },
                  }}
                  endDatePickerProps={{
                    id: "log-date-end",
                    name: "log-date-end",
                    defaultValue: endDate ? endDate.toISOString() : "",
                    onChange: (val?: string) => {
                      const rawDate = val ? new Date(val) : null;
                      const date = rawDate;
                      const errors = validateDates(startDate, date);
                      setDateErrors(errors);
                      setEndDate(date);
                    },
                  }}
                />
                {(dateErrors.start || dateErrors.end) && (
                  <p className={styles.errorText} role="alert">
                    {dateErrors.start || dateErrors.end}
                  </p>
                )}
              </>
            )}
            <Button
              type="button"
              className={styles.applyButton}
              onClick={handleApply}
              disabled={disableApply}
            >
              Apply filter
            </Button>
          </div>
        )}
      </div>
    );
  },
);

export default DateRangePicker;

function areDatesOnSameDay(
  date1: Date | null | undefined,
  date2: Date | null | undefined,
) {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
/**
 *
 * @param startDate - start date
 * @param endDate - end date
 * @returns formatted start / end
 */
export function formatDateRangeToMMDDYY(
  startDate: Date | undefined | null,
  endDate: Date | undefined | null,
) {
  const displayStart = startDate
    ? startDate.toLocaleDateString("en-US", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
    : "";

  const displayEnd = endDate
    ? endDate.toLocaleDateString("en-US", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
    : "";

  const displayDateRange =
    displayStart && displayEnd ? `${displayStart} - ${displayEnd}` : undefined;

  return displayDateRange;
}
