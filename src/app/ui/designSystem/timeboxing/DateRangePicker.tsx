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

export interface DateErrors {
  start?: string;
  end?: string;
}

const normalizeStart = (date: Date | null) =>
  date
    ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
    : null;

const normalizeEnd = (date: Date | null) =>
  date
    ? new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59,
        999,
      )
    : null;

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

const presetOptions = [
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
        startDate: normalizeStart(start),
        endDate: normalizeEnd(end),
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
        startDate: normalizeStart(start),
        endDate: normalizeEnd(end),
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
        startDate: normalizeStart(start),
        endDate: normalizeEnd(end),
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
        startDate: normalizeStart(start),
        endDate: normalizeEnd(end),
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
        startDate: normalizeStart(start),
        endDate: normalizeEnd(end),
      };
    },
  },
];

const CUSTOM_VALUE = "custom";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (...args: unknown[]) => void;
  id: string;
  handleClear?: () => Promise<void>;
  popoverSide?: "left" | "right";
  placeholderText?: string;
}

export type DateRangePickerRef = {
  getStartDate: () => Date | null;
  getEndDate: () => Date | null;
  getIsRelativeRange: () => boolean | null;
};

/**
 * A date range picker component with a toggleable modal and quick preset buttons.
 * @param root0 - The component props.
 * @param root0.startDate - The start date.
 * @param root0.endDate - The end date.
 * @param root0.id - The id for the form input.
 * @param root0.onChange - The change handler.
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
      onChange,
      id,
      handleClear,
      popoverSide = "right",
      placeholderText = "Filter by date",
    },
    ref,
  ) => {
    const [selectedPreset, setSelectedPreset] = useState<string>("");
    const [customStart, setCustomStart] = useState<Date | null>(initialStart);
    const [customEnd, setCustomEnd] = useState<Date | null>(initialEnd);
    const [dateErrors, setDateErrors] = useState<DateErrors>({});
    const [isOpen, setIsOpen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (initialStart === null || initialEnd === null) return;

      if (initialStart) {
        setCustomStart(initialStart);
      }

      if (initialEnd) {
        setCustomEnd(initialEnd);
      }

      let somePresetValue = false;
      presetOptions.forEach((p) => {
        const { startDate, endDate } = p.getRange();

        if (
          areDatesOnSameDay(startDate, initialStart) &&
          areDatesOnSameDay(endDate, initialEnd)
        ) {
          somePresetValue = true;
          setSelectedPreset(p.value);
        }
      });

      if (!somePresetValue) {
        setSelectedPreset(CUSTOM_VALUE);
      }
    }, [initialStart, initialEnd]);

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
      if (isOpen) {
        const startInput = document.getElementById(
          "log-date-start",
        ) as HTMLInputElement;
        const endInput = document.getElementById(
          "log-date-end",
        ) as HTMLInputElement;
        if (startInput)
          startInput.value = customStart
            ? customStart.toLocaleDateString()
            : "";
        if (endInput)
          endInput.value = customEnd ? customEnd.toLocaleDateString() : "";
      }
    }, [isOpen, customStart, customEnd]);

    const getDisplayedRange = () => {
      if (selectedPreset && selectedPreset !== CUSTOM_VALUE) {
        const preset = presetOptions.find((p) => p.value === selectedPreset);
        if (preset) {
          return preset.getRange();
        }
      }
      return { startDate: customStart, endDate: customEnd };
    };

    const { startDate, endDate } = getDisplayedRange();

    const formattedStart = startDate ? startDate.toLocaleDateString() : "";
    const formattedEnd = endDate ? endDate.toLocaleDateString() : "";

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

    const displayText =
      formattedStart && formattedEnd ? `${displayStart} - ${displayEnd}` : "";

    const validateDates = (
      newStartDate: Date | null,
      newEndDate: Date | null,
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
      if (value !== CUSTOM_VALUE) {
        setDateErrors({});
      }
    };

    useImperativeHandle(ref, () => ({
      getStartDate: () => startDate,
      getEndDate: () => endDate,
      getIsRelativeRange: () => selectedPreset !== CUSTOM_VALUE,
    }));

    const handleApply = () => {
      onChange(
        selectedPreset && selectedPreset !== CUSTOM_VALUE
          ? presetOptions
              .find((p) => p.value === selectedPreset)
              ?.getRange() || {
              startDate: null,
              endDate: null,
            }
          : { startDate: customStart, endDate: customEnd },
      );
      setIsOpen(false);
    };

    const handleClearClick = async () => {
      if (handleClear) {
        await handleClear();
      }
      setCustomStart(null);
      setCustomEnd(null);
      setSelectedPreset("");

      setDateErrors({});
    };

    const disableApply = !selectedPreset;

    return (
      <div className={styles.datePickerContainer} ref={containerRef}>
        <div
          className={classNames(
            styles.textInputContainer,
            displayText ? styles.textInputContainer__wide : "",
          )}
        >
          <Icon.CalendarToday
            size={3}
            className={styles.calendarIcon}
            aria-label="date-range-calendar-icon"
          />
          <TextInput
            id={id}
            type="text"
            className={styles.dateRangeInput}
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

                {presetOptions.map(({ label, value }) => (
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
                  id={`preset-${CUSTOM_VALUE}`}
                  name="date-filter"
                  label="Custom date range"
                  data-testid={`preset-${CUSTOM_VALUE}`}
                  aria-label="Custom date range radio button"
                  value={CUSTOM_VALUE}
                  checked={selectedPreset === CUSTOM_VALUE}
                  onChange={() => handlePresetChange(CUSTOM_VALUE)}
                />
              </fieldset>
            </FormGroup>

            <div className={styles.clearButtonContainer}></div>
            {selectedPreset === CUSTOM_VALUE && (
              <>
                <USWDSDateRangePicker
                  startDateLabel="Start Date"
                  endDateLabel="End Date"
                  aria-label="Date range picker"
                  startDatePickerProps={{
                    id: "log-date-start",
                    name: "log-date-start",
                    value: customStart ? customStart.toLocaleDateString() : "",
                    onChange: (val?: string) => {
                      const rawDate = val ? new Date(val) : null;
                      const date = normalizeStart(rawDate);
                      const errors = validateDates(date, customEnd);
                      setDateErrors(errors);
                      setCustomStart(date);
                    },
                  }}
                  endDatePickerProps={{
                    id: "log-date-end",
                    name: "log-date-end",
                    value: customEnd ? customEnd.toLocaleDateString() : "",
                    onChange: (val?: string) => {
                      const rawDate = val ? new Date(val) : null;
                      const date = normalizeEnd(rawDate);
                      const errors = validateDates(customStart, date);
                      setDateErrors(errors);
                      setCustomEnd(date);
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

function areDatesOnSameDay(date1: Date | null, date2: Date | null) {
  if (date1 === null || date2 === null) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
