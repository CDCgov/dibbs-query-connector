"use client";

import { useState, useEffect, useCallback, ChangeEvent, useRef } from "react";
import styles from "./auditLogs.module.scss";
import classNames from "classnames";
import {
  DateErrors,
  DateRangePickerRef,
  DateRangeInfo,
} from "@/app/ui/designSystem/timeboxing/DateRangePicker";
import DateRangePicker from "@/app/ui/designSystem/timeboxing/DateRangePicker";
import SearchField from "@/app/ui/designSystem/searchField/SearchField";
import Table from "@/app/ui/designSystem/table/Table";
import { Button, Select, Pagination } from "@trussworks/react-uswds";
import WithAuth from "@/app/ui/components/withAuth/WithAuth";
import Skeleton from "react-loading-skeleton";
import AuditLogDrawer from "./components/auditLogDrawer";
import {
  auditLogActionTypeMap,
  auditLogUserMap,
  initializeAuditLogUserMap,
} from "./components/auditLogMaps";
import {
  getAuditLogsPaginated,
  getAuditLogAuthors,
  getAuditLogActionTypes,
  LogEntry,
} from "@/app/backend/audit-logs/service";
import {
  AuditLogFilterParams,
  QCPagedResponse,
} from "@/app/models/responses/collections";

/**
 * Client component for the Audit Logs page.
 * @returns - The AuditLogs component.
 */
const AuditLogs: React.FC = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeInfo>({
    startDate: null,
    endDate: null,
    isRelativeRange: false,
  });
  const [_, setDateErrors] = useState<DateErrors>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [actionsPerPage, setActionsPerPage] = useState(10);
  const [pagedResult, setPagedResult] =
    useState<QCPagedResponse<LogEntry> | null>(null);
  const [authors, setAuthors] = useState<string[]>([]);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const datePickerRef = useRef<DateRangePickerRef>(null);
  const fetchIdRef = useRef(0);

  const buildFilterParams = useCallback((): AuditLogFilterParams => {
    // action types whose human-readable label matches the search term, so
    // label searches (e.g. "sign in") still match rows server-side
    const searchedActionTypes = debouncedSearch
      ? Object.entries(auditLogActionTypeMap)
          .filter(([, config]) =>
            config.label.toLowerCase().includes(debouncedSearch.toLowerCase()),
          )
          .map(([actionType]) => actionType)
      : [];

    return {
      pageIndex: currentPage - 1,
      pageSize: actionsPerPage,
      author: selectedName || undefined,
      actionType: selectedAction || undefined,
      textSearch: debouncedSearch || undefined,
      searchedActionTypes:
        searchedActionTypes.length > 0 ? searchedActionTypes : undefined,
      startDate: dateRange.startDate?.toISOString(),
      endDate: dateRange.endDate?.toISOString(),
    };
  }, [
    currentPage,
    actionsPerPage,
    selectedName,
    selectedAction,
    debouncedSearch,
    dateRange,
  ]);

  const fetchPage = useCallback(async () => {
    // ignore out-of-order responses: only the latest request may update state
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    try {
      const result = await getAuditLogsPaginated(buildFilterParams());
      if (fetchId === fetchIdRef.current) {
        setPagedResult(result);
      }
    } catch (error) {
      console.error(`Failed to fetch audit logs: ${error}`);
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [buildFilterParams]);

  // load filter dropdown options and the username -> full name map once;
  // the user map loads first so author options can be sorted by the full
  // names they render as, not by raw username
  useEffect(() => {
    initializeAuditLogUserMap()
      .then(() => getAuditLogAuthors())
      .then((fetchedAuthors) =>
        setAuthors(
          fetchedAuthors.sort((a, b) =>
            auditLogUserMap(a).localeCompare(auditLogUserMap(b)),
          ),
        ),
      )
      .catch((error) =>
        console.error(`Failed to fetch audit log authors: ${error}`),
      );
    getAuditLogActionTypes()
      .then(setActionTypes)
      .catch((error) =>
        console.error(`Failed to fetch audit log action types: ${error}`),
      );
  }, []);

  // debounce text search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedName, selectedAction, dateRange, debouncedSearch]);

  // fetch a page of logs whenever page or filters change
  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const logs = pagedResult?.items ?? [];
  const totalItems = pagedResult?.totalItems ?? 0;
  const totalPages = pagedResult?.totalPages ?? 0;

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
              {authors.map((author) => (
                <option key={author} value={author}>
                  {auditLogUserMap(author)}
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
              {actionTypes.map((actionType) => (
                <option key={actionType} value={actionType}>
                  {auditLogActionTypeMap[actionType]?.label || actionType}
                </option>
              ))}
            </Select>
          </div>
          <div className={classNames(styles.inputGroup)}>
            <label htmlFor="dateRange">Date range</label>
            <div>
              <DateRangePicker
                ref={datePickerRef}
                id={"auditLogDatePicker"}
                startDate={dateRange.startDate || null}
                endDate={dateRange.endDate || null}
                isRelativeRange={false}
                onChange={() => {
                  const startDate = datePickerRef.current?.getStartDate();
                  const endDate = datePickerRef.current?.getEndDate();
                  const isRelativeRange =
                    datePickerRef.current?.getIsRelativeRange() ?? false;
                  setDateRange({ startDate, endDate, isRelativeRange });
                }}
                handleClear={() =>
                  setDateRange({
                    startDate: null,
                    endDate: null,
                    isRelativeRange: false,
                  })
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
          {!loading && totalItems === 0 ? (
            <div className={styles.noResultsContainer}>
              <div className={styles.noResultsBackground}>
                <h3>No results found.</h3>
                <Button
                  type="reset"
                  onClick={() => {
                    setSearch("");
                    setSelectedName("");
                    setSelectedAction("");
                    setDateErrors({});
                    setDateRange({
                      startDate: null,
                      endDate: null,
                      isRelativeRange: false,
                    });
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
                    {logs.map((log, index) => (
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

          {!loading && totalItems > 0 && (
            <div className={classNames(styles.paginationContainer)}>
              <span>
                {`Showing ${(currentPage - 1) * actionsPerPage + 1} -
        ${Math.min(currentPage * actionsPerPage, totalItems)} of
        ${totalItems} actions`}
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
