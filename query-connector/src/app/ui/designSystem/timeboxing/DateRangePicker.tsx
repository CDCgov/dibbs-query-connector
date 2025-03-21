"use client";

import { useState, useEffect, useRef } from "react";
import {
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

/**
 * A date range picker component with a toggleable modal.
 * @param root0 - The component props.
 * @param root0.startDate - The start date.
 * @param root0.endDate - The end date.
 * @param root0.onChange - The change handler.
 * @returns - The date range picker component.
 */
const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
}) => {
  const [dateErrors, setDateErrors] = useState<DateErrors>({});
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const formattedStart = startDate ? startDate.toLocaleDateString() : "";
  const formattedEnd = endDate ? endDate.toLocaleDateString() : "";
  const displayText =
    formattedStart && formattedEnd ? `${formattedStart} - ${formattedEnd}` : "";

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
    validateDates(startDate, endDate);
  }, [startDate, endDate]);

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

  return (
    <div className={styles.datePickerContainer} ref={containerRef}>
      <div className={styles.textInputContainer}>
        <TextInput
          type="text"
          id="date-range-input"
          name="date-range-input"
          value={displayText}
          readOnly
          onClick={() => setIsOpen((prev) => !prev)}
        />
        {!displayText && (
          <Icon.CalendarToday size={3} className={styles.calendarIcon} />
        )}
      </div>
      {isOpen && (
        <div className={styles.datePickerModal}>
          <USWDSDateRangePicker
            startDateLabel="Start Date"
            endDateLabel="End Date"
            startDatePickerProps={{
              id: "log-date-start",
              name: "log-date-start",
              value: formattedStart,
              onChange: (val?: string) => {
                const date = val ? new Date(val) : null;
                if (!validateDates(date, endDate).start) {
                  onChange({ startDate: date, endDate });
                }
              },
            }}
            endDatePickerProps={{
              id: "log-date-end",
              name: "log-date-end",
              value: formattedEnd,
              onChange: (val?: string) => {
                const date = val ? new Date(val) : null;
                if (!validateDates(startDate, date).end) {
                  onChange({ startDate, endDate: date });
                }
              },
            }}
          />
          {(dateErrors.start || dateErrors.end) && (
            <p className={styles.errorText}>
              {dateErrors.start || dateErrors.end}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
