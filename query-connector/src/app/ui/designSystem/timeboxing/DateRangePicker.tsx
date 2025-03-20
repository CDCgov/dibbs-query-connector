"use client";

import { useState, useEffect } from "react";
import { DateRangePicker as USWDSDateRangePicker } from "@trussworks/react-uswds";
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
 * A date range picker component.
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
  const [dateErrors, setDateErrors] = useState<{
    start?: string;
    end?: string;
  }>({});

  const validateDates = (
    newStartDate: Date | null,
    newEndDate: Date | null,
  ) => {
    const errors: { start?: string; end?: string } = {};

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
      .getElementById("event-date-start")
      ?.classList.toggle(styles.bgErrorLighter, !!errors.start);
    document
      .getElementById("event-date-start")
      ?.classList.toggle(styles.borderError, !!errors.start);
    document
      .getElementById("event-date-end")
      ?.classList.toggle(styles.bgErrorLighter, !!errors.end);
    document
      .getElementById("event-date-end")
      ?.classList.toggle(styles.borderError, !!errors.end);

    setDateErrors(errors);
    return errors;
  };

  useEffect(() => {
    validateDates(startDate, endDate);
  }, [startDate, endDate]);

  return (
    <div>
      <USWDSDateRangePicker
        startDateLabel="Start Date"
        endDateLabel="End Date"
        startDatePickerProps={{
          id: "event-date-start",
          name: "event-date-start",
          value: startDate ? startDate.toISOString().split("T")[0] : "",
          onChange: (val?: string) => {
            const date = val ? new Date(val) : null;
            if (!validateDates(date, endDate).start) {
              onChange({ startDate: date, endDate });
            }
          },
        }}
        endDatePickerProps={{
          id: "event-date-end",
          name: "event-date-end",
          value: endDate ? endDate.toISOString().split("T")[0] : "",
          onChange: (val?: string) => {
            const date = val ? new Date(val) : null;
            if (!validateDates(startDate, date).end) {
              onChange({ startDate, endDate: date });
            }
          },
        }}
      />
      {(dateErrors.start || dateErrors.end) && (
        <p className={styles.errorText}>{dateErrors.start || dateErrors.end}</p>
      )}
    </div>
  );
};

export default DateRangePicker;
