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
import { getAuditLogs, LogEntry } from "@/app/backend/dbServices/audit-logs";
import Skeleton from "react-loading-skeleton";
import AuditLogDrawer from "./components/auditLogDrawer";
import {
  auditLogActionTypeMap,
  labelToActionType,
  auditLogUserMap,
  initializeAuditLogUserMap,
} from "./components/auditLogMaps";

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
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  useEffect(() => {
    async function fetchAuditLogs() {
      const logs = await getAuditLogs();
      return logs.map((log) => {
        // Convert createdAt to Date object that works in all browsers in correct timezone
        let str = String(log.createdAt).trim();

        if (!str.includes("T")) str = str.replace(" ", "T");
        if (!str.endsWith("Z")) str += "Z";

        return {
          ...log,
          createdAt: new Date(str),
        };
      });
    }

    initializeAuditLogUserMap();
    setLoading(true);

    fetchAuditLogs().then((v) => {
      setLogs(v);
      setLoading(false);
    });
  }, []);

  const [filteredLogs, setFilteredLogs] = useState(logs);

  const uniqueNames = useMemo(
    () =>
      Array.from(
        new Set(logs.map((log) => auditLogUserMap(log.author))),
      ).sort(),
    [logs],
  );

  const uniqueActions = useMemo(
    () =>
      Array.from(
        new Set(
          logs.map(
            (log) =>
              auditLogActionTypeMap[log.actionType]?.label || log.actionType,
          ),
        ),
      ).sort(),
    [logs],
  );

  const minDate = useMemo(
    () =>
      logs.length > 0
        ? new Date(Math.min(...logs.map((log) => log.createdAt.getTime())))
        : null,
    [logs],
  );
  const maxDate = useMemo(
    () =>
      logs.length > 0
        ? new Date(Math.max(...logs.map((log) => log.createdAt.getTime())))
        : null,
    [logs],
  );

  useEffect(() => {
    setFilteredLogs(
      logs.filter((log) => {
        const matchesName = selectedName
          ? auditLogUserMap(log.author) === selectedName
          : true;
        const matchesAction = selectedAction
          ? log.actionType === labelToActionType[selectedAction]
          : true;
        const actionLabel =
          auditLogActionTypeMap[log.actionType]?.label?.toLowerCase() || "";
        const formattedAction =
          auditLogActionTypeMap[log.actionType]?.format(log)?.toLowerCase() ||
          "";
        const fullName = auditLogUserMap(log.author).toLowerCase();
        const matchesSearch =
          search.length === 0 ||
          log.author.toLowerCase().includes(search.toLowerCase()) ||
          fullName.includes(search.toLowerCase()) ||
          log.actionType.toLowerCase().includes(search.toLowerCase()) ||
          actionLabel.includes(search.toLowerCase()) ||
          formattedAction.includes(search.toLowerCase()) ||
          JSON.stringify(log.auditMessage)
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesDate =
          (!dateRange.startDate || log.createdAt >= dateRange.startDate) &&
          (!dateRange.endDate || log.createdAt <= dateRange.endDate);
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
            placeholder="Search name, action, or message"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            className={classNames(styles.searchField)}
          />
        </div>

        <>
          {!loading && filteredLogs.length === 0 ? (
            <div className={styles.noResultsContainer}>
              <div className={styles.noResultsBackground}>
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
            </div>
          ) : (
            <div className={styles.auditTableContainer}>
              <Table>
                <thead>
                  <tr>
                    <th className={styles.tableHeader}>Name</th>
                    <th className={styles.tableHeader}>Action</th>
                    <th className={styles.tableHeader}>Date</th>
                  </tr>
                </thead>

                {loading ? (
                  <tbody>{LoadingTable}</tbody>
                ) : (
                  <tbody>
                    {paginatedLogs.map((log, index) => (
                      <tr
                        className={styles.tableRows}
                        key={index}
                        onClick={() => {
                          setSelectedLog(log);
                          setDrawerOpen(true);
                        }}
                      >
                        <td>{auditLogUserMap(log.author)}</td>
                        <td>
                          {auditLogActionTypeMap[log.actionType]?.format(log)
                            ? auditLogActionTypeMap[log.actionType].format(log)
                            : log.actionType}
                        </td>
                        <td>{log.createdAt.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </Table>
            </div>
          )}

          {!loading && filteredLogs.length > 0 && (
            <div className={classNames(styles.paginationContainer)}>
              <span>
                {`Showing ${(currentPage - 1) * actionsPerPage + 1} -
        ${Math.min(currentPage * actionsPerPage, filteredLogs.length)} of 
        ${filteredLogs.length} actions`}
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
                  onChange={(e) => {
                    setActionsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </Select>
              </div>
              <AuditLogDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                log={selectedLog}
              />
            </div>
          )}
        </>
      </div>
    </WithAuth>
  );
};

export default AuditLogs;

const LoadingTable = (
  <tr>
    <td>
      <Skeleton />
    </td>
    <td>
      <Skeleton />
    </td>
    <td>
      <Skeleton />
    </td>
    <td>
      <Skeleton />
    </td>
    <td>
      <Skeleton />
    </td>
    <td>
      <Skeleton />
    </td>
    <td>
      <Skeleton />
    </td>
    <td>
      <Skeleton />
    </td>
  </tr>
);
