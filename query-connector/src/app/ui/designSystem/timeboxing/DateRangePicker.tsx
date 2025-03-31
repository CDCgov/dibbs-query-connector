"use client";

import { useState, useEffect, useRef } from "react";
import {
  Button,
  DateRangePicker as USWDSDateRangePicker,
  Icon,
  TextInput,
} from "@trussworks/react-uswds";
import styles from "./DateRangePicker.module.scss";

export interface DateRange {
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface DateErrors {
  start?: string;
  end?: string;
}

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (dates: { startDate: Date | null; endDate: Date | null }) => void;
}

const normalizeStart = (date: Date | null) =>
  date ? new Date(date.setHours(0, 0, 0, 0)) : null;

const normalizeEnd = (date: Date | null) =>
  date ? new Date(date.setHours(23, 59, 59, 999)) : null;

/**
 * A date range picker component with a toggleable modal.
 * @param root0 - The component props.
 * @param root0.startDate - The start date.
 * @param root0.endDate - The end date.
 * @param root0.onChange - The change handler.
 * @returns - The date range picker component.
 */
const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate: initialStart,
  endDate: initialEnd,
  onChange,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(initialStart);
  const [endDate, setEndDate] = useState<Date | null>(initialEnd);
  const [dateErrors, setDateErrors] = useState<DateErrors>({});
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleDateInputClick = (id: string) => {
    const button = document.querySelector(
      `#${id} ~ button[data-testid='date-picker-button']`,
    );
    if (button) (button as HTMLElement).click();
  };

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

  useEffect(() => {
    setStartDate(initialStart);
    setEndDate(initialEnd);
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

    return () => document.removeEventListener("mousedown", handleClickOutside);
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
        startInput.value = startDate ? startDate.toLocaleDateString() : "";
      if (endInput)
        endInput.value = endDate ? endDate.toLocaleDateString() : "";
    }
  }, [isOpen, startDate, endDate]);

  return (
    <div className={styles.datePickerContainer} ref={containerRef}>
      <div className={styles.textInputContainer}>
        <TextInput
          type="text"
          id="date-range-input"
          name="date-range-input"
          aria-label="Date range input"
          value={displayText}
          readOnly
          onClick={() => setIsOpen((prev) => !prev)}
        />
        <Icon.CalendarToday
          size={3}
          className={styles.calendarIcon}
          aria-label="date-range-calendar-icon"
        />
      </div>
      {isOpen && (
        <div className={styles.customDateRangeWrapper}>
          <div className={styles.datePickerModal}>
            <div className={styles.clearButtonContainer}>
              <Button
                unstyled
                type="button"
                data-testid="date-range-clear-button"
                className={styles.clearButton}
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                  setDateErrors({});
                  setIsOpen(false);
                  onChange({ startDate: null, endDate: null });
                  setTimeout(() => {
                    const startInput = document.getElementById(
                      "log-date-start",
                    ) as HTMLInputElement;
                    const endInput = document.getElementById(
                      "log-date-end",
                    ) as HTMLInputElement;
                    if (startInput) startInput.value = "";
                    if (endInput) endInput.value = "";

                    const inputField = document.getElementById(
                      "date-range-input",
                    ) as HTMLInputElement;
                    if (inputField) inputField.value = "";
                  });
                }}
              >
                Clear
              </Button>
            </div>
            <USWDSDateRangePicker
              startDateLabel="Start Date"
              endDateLabel="End Date"
              aria-label="Date range picker"
              startDatePickerProps={{
                id: "log-date-start",
                name: "log-date-start",
                value: formattedStart,
                onChange: (val?: string) => {
                  const rawDate = val ? new Date(val) : null;
                  const date = normalizeStart(rawDate);
                  const errors = validateDates(date, endDate);
                  setDateErrors(errors);
                  setStartDate(date);
                  if (Object.keys(errors).length === 0) {
                    onChange({
                      startDate: date,
                      endDate: normalizeEnd(endDate),
                    });
                  }
                },
              }}
              endDatePickerProps={{
                id: "log-date-end",
                name: "log-date-end",
                value: formattedEnd,
                // onClick: () => handleDateInputClick("log-date-end"),
                onChange: (val?: string) => {
                  const rawDate = val ? new Date(val) : null;
                  const date = normalizeEnd(rawDate);
                  const errors = validateDates(startDate, date);
                  setDateErrors(errors);
                  setEndDate(date);
                  if (Object.keys(errors).length === 0) {
                    onChange({
                      startDate: normalizeStart(startDate),
                      endDate: date,
                    });
                  }
                },
              }}
            />
            {(dateErrors.start || dateErrors.end) && (
              <p className={styles.errorText} role="alert">
                {dateErrors.start || dateErrors.end}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
