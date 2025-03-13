"use client";

import { useState, useEffect, ChangeEvent, useMemo } from "react";
import styles from "./auditLogs.module.scss";
import classNames from "classnames";
import SearchField from "@/app/ui/designSystem/searchField/SearchField";
import Table from "@/app/ui/designSystem/table/Table";
import { Select, Pagination, DatePicker } from "@trussworks/react-uswds";

/**
 * Client component for the Audit Logs page.
 * @returns - The AuditLogs component.
 */
const AuditLogs: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionsPerPage, setActionsPerPage] = useState(10);

  // Dummy data multiplied by 50 to simulate a large dataset
  const logs = useMemo(() => {
    const baseData = [
      {
        name: "Rocky Balboa",
        action: "Created Report",
        date: new Date("2025-03-10T14:30:00Z"),
      },
      {
        name: "Apollo Creed",
        action: "Edited Report",
        date: new Date("2025-03-09T09:15:00Z"),
      },
      {
        name: "Rocky Balboa",
        action: "Deleted Entry",
        date: new Date("2022-03-08T17:45:00Z"),
      },
      {
        name: "Clubber Lang",
        action: "Created Report",
        date: new Date("2024-03-07T12:00:00Z"),
      },
      {
        name: "Ivan Drago",
        action: "Viewed Entry",
        date: new Date("2025-03-06T22:10:00Z"),
      },
    ];

    return Array.from({ length: 50 }, (_, index) =>
      baseData.map((entry) => ({
        ...entry,
        date: new Date(entry.date.getTime() + index * 86400000),
      })),
    ).flat();
  }, []);

  // Get unique names from logs; we could have this be a pull of getUsers() to avoid recalculating it
  // in theory, this would then allow a superadmin to determine is a user has not done anything, either
  const uniqueNames = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.name))).sort();
  }, [logs]);

  // Get unique actions from logs; we could have this be a const to avoid recalculating it
  // Other question would be if we have actions that are calculated in the DB from a large json, if that large json needs to be represented here
  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.action))).sort();
  }, [logs]);

  // Get min/max dates from logs; we could have min only calculated or set it to an arbitrary value
  // similarly, max date could just be a calculation of today's date
  const minDate = useMemo(() => {
    return logs.length > 0
      ? new Date(Math.min(...logs.map((log) => log.date.getTime())))
      : null;
  }, [logs]);

  const maxDate = useMemo(() => {
    return logs.length > 0
      ? new Date(Math.max(...logs.map((log) => log.date.getTime())))
      : null;
  }, [logs]);

  // Calculate total pages based on logs.length and actionsPerPage
  const [filteredLogs, setFilteredLogs] = useState(logs);

  // Update filtered logs dynamically when filters change
  useEffect(() => {
    setFilteredLogs(
      logs.filter((log) => {
        const matchesName = selectedName ? log.name === selectedName : true;
        const matchesAction = selectedAction
          ? log.action === selectedAction
          : true;
        const matchesSearch =
          search.length === 0 ||
          log.name.toLowerCase().includes(search.toLowerCase()) ||
          log.action.toLowerCase().includes(search.toLowerCase());
        const matchesDate = selectedDate
          ? log.date.toISOString().split("T")[0] ===
            selectedDate.toISOString().split("T")[0]
          : true;

        return matchesName && matchesAction && matchesSearch && matchesDate;
      }),
    );
    setCurrentPage(1);
  }, [selectedName, selectedAction, selectedDate, search, logs]);

  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(
      (currentPage - 1) * actionsPerPage,
      currentPage * actionsPerPage,
    );
  }, [filteredLogs, currentPage, actionsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / actionsPerPage);

  return (
    <div className={classNames(styles.mainContainerWider)}>
      <div className={classNames("grid-row", "margin-bottom-3")}>
        <h1 className="page-title grid-col-10">Audit Log</h1>
      </div>

      <div
        className={classNames(
          "grid-row",
          "margin-bottom-3",
          "align-center",
          styles.searchContainer,
        )}
      >
        <div className={classNames(styles.inputGroup)}>
          <label htmlFor="name">Name(s)</label>
          <Select
            name="name"
            id="name"
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
          >
            <option value="" disabled></option>
            {uniqueNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>
        <div className={classNames(styles.inputGroup)}>
          <label htmlFor="action">Action(s)</label>
          <Select
            name="action"
            id="action"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
          >
            <option value="" disabled></option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </Select>
        </div>
        <div className={classNames(styles.inputGroup)}>
          <label htmlFor="date">Date</label>
          <DatePicker
            id="date"
            name="date"
            onChange={(value) =>
              setSelectedDate(value ? new Date(value) : null)
            }
            value={
              selectedDate instanceof Date && !isNaN(selectedDate.getTime())
                ? selectedDate.toISOString().split("T")[0]
                : ""
            }
            minDate={minDate ? minDate.toISOString().split("T")[0] : ""}
            maxDate={maxDate ? maxDate.toISOString().split("T")[0] : ""}
          />
        </div>
        <SearchField
          id="search"
          placeholder="Search name or action"
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          className={styles.searchField}
        />
      </div>

      <div className={styles.auditTableContainer}>
        <Table className={styles.auditTable}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>Name</th>
              <th className={styles.tableHeader}>Action</th>
              <th className={styles.tableHeader}>Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log, index) => (
              <tr key={index}>
                <td>{log.name}</td>
                <td>{log.action}</td>
                <td>{log.date.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div className={classNames(styles.paginationContainer)}>
        <span>
          Showing {(currentPage - 1) * actionsPerPage + 1}-
          {Math.min(currentPage * actionsPerPage, filteredLogs.length)} of{" "}
          {filteredLogs.length} actions
        </span>

        <Pagination
          className={styles.paginationText}
          pathname="/auditLogs"
          totalPages={totalPages}
          currentPage={currentPage}
          onClickNext={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          onClickPrevious={() =>
            setCurrentPage((prev) => Math.max(prev - 1, 1))
          }
          onClickPageNumber={(event, page) => {
            event.preventDefault();
            setCurrentPage(page);
          }}
        />

        <div className={styles.actionsPerPageContainer}>
          <label htmlFor="actionsPerPage">Actions per page</label>
          <Select
            name="actionsPerPage"
            id="actionsPerPage"
            value={actionsPerPage}
            className={styles.actionsPerPageDropdown}
            onChange={(e) => setActionsPerPage(Number(e.target.value))}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
