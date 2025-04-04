"use client";

import { useState, useEffect, ChangeEvent, useMemo } from "react";
import styles from "./auditLogs.module.scss";
import classNames from "classnames";
import {
  DateRange,
  DateErrors,
} from "@/app/ui/designSystem/timeboxing/DateRangePicker";
import DateRangePicker from "@/app/ui/designSystem/timeboxing/DateRangePicker";
import SearchField from "@/app/ui/designSystem/searchField/SearchField";
import Table from "@/app/ui/designSystem/table/Table";
import { Button, Select, Pagination } from "@trussworks/react-uswds";
import WithAuth from "@/app/ui/components/withAuth/WithAuth";

/**
 * Client component for the Audit Logs page.
 * @returns - The AuditLogs component.
 */
const AuditLogs: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [dateErrors, setDateErrors] = useState<DateErrors>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [actionsPerPage, setActionsPerPage] = useState(10);

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
    )
      .flat()
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, []);

  const [filteredLogs, setFilteredLogs] = useState(logs);

  const uniqueNames = useMemo(
    () => Array.from(new Set(logs.map((log) => log.name))).sort(),
    [logs],
  );
  const uniqueActions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.action))).sort(),
    [logs],
  );

  const minDate = useMemo(
    () =>
      logs.length > 0
        ? new Date(Math.min(...logs.map((log) => log.date.getTime())))
        : null,
    [logs],
  );
  const maxDate = useMemo(
    () =>
      logs.length > 0
        ? new Date(Math.max(...logs.map((log) => log.date.getTime())))
        : null,
    [logs],
  );

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
        const matchesDate =
          (!dateRange.startDate || log.date >= dateRange.startDate) &&
          (!dateRange.endDate || log.date <= dateRange.endDate);
        return matchesName && matchesAction && matchesSearch && matchesDate;
      }),
    );
    setCurrentPage(1);
  }, [selectedName, selectedAction, dateRange, search, logs]);

  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(
      (currentPage - 1) * actionsPerPage,
      currentPage * actionsPerPage,
    );
  }, [filteredLogs, currentPage, actionsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / actionsPerPage);

  return (
    <WithAuth>
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
              <option value=""></option>
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
              <option value=""></option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </Select>
          </div>
          <div className={classNames(styles.inputGroup)}>
            <label htmlFor="dateRange">Custom date range</label>
            <div>
              <DateRangePicker
                startDate={dateRange.startDate || null}
                endDate={dateRange.endDate || null}
                onChange={({ startDate, endDate }) =>
                  setDateRange({ startDate, endDate })
                }
              />
            </div>
          </div>
          <SearchField
            id="search"
            placeholder="Search name or action"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            className={classNames(styles.searchField)}
          />
        </div>

        {filteredLogs.length === 0 ? (
          <div className={styles.noResultsContainer}>
            <h3>No results found.</h3>
            <Button
              type="reset"
              outline
              className={styles.clearFiltersButton}
              onClick={() => {
                setSearch("");
                setSelectedName("");
                setSelectedAction("");
                setDateErrors({});
                setDateRange({});
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.auditTableContainer}>
              <Table>
                <thead>
                  <tr>
                    <th className={styles.tableHeader}>Name</th>
                    <th className={styles.tableHeader}>Action</th>
                    <th className={styles.tableHeader}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log, index) => (
                    <tr className={styles.tableRows} key={index}>
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
          </>
        )}
      </div>
    </WithAuth>
  );
};

export default AuditLogs;
