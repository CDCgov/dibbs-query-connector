"use client";

import { useState, ChangeEvent } from "react";
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
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionsPerPage, setActionsPerPage] = useState(10);

  // Mock data array (replace with real API data); the data should have the
  // following structure: { name: string, action: json, date: datetime }
  // TBD if action will be something parsed from json log earlier in process
  const logs = Array(243).fill({ name: "", action: {}, date: Date });

  // Calculate total pages based on logs.length and actionsPerPage
  const totalPages = Math.ceil(logs.length / actionsPerPage);

  return (
    <div className={classNames("main-container__wide", styles.mainContainer)}>
      <div className={classNames("grid-container grid-row", "margin-bottom-4")}>
        <h1 className="page-title grid-col-10">Audit Log</h1>
      </div>

      <div className={classNames("grid-row", "margin-bottom-3")}>
        <div className="grid-col-3">
          <label htmlFor="name">Name(s)</label>
          <Select
            name="name"
            id="name"
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
          >
            <option value="">Select a name</option>
          </Select>
        </div>
        <div className="grid-col-3">
          <label htmlFor="action">Action(s)</label>
          <Select
            name="action"
            id="action"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
          >
            <option value="">Select an action</option>
          </Select>
        </div>
        <div className="grid-col-3">
          <label htmlFor="date">Date</label>
          <DatePicker
            id="date"
            name="date"
            onChange={(value) => setSelectedDate(value || "")}
            value={selectedDate}
          />
        </div>
        <div className="grid-col-3">
          <label htmlFor="search">Search</label>
          <SearchField
            id="search"
            placeholder="Search name or action"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
          />
        </div>
      </div>

      <Table fullWidth>
        <thead>
          <tr>
            <th>Name</th>
            <th>Action</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody></tbody>
      </Table>

      <div className="margin-top-3 display-flex flex-justify-between">
        <span>
          Showing {(currentPage - 1) * actionsPerPage + 1}-
          {Math.min(currentPage * actionsPerPage, logs.length)} of {logs.length}{" "}
          actions
        </span>

        <Pagination
          pathname="/auditLogs"
          totalPages={totalPages}
          currentPage={currentPage}
          // onPageChange={(page: number) => setCurrentPage(page)}
        />

        <div>
          <label htmlFor="actionsPerPage">Actions per page</label>
          <Select
            name="actionsPerPage"
            id="actionsPerPage"
            value={actionsPerPage}
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
