"use client";

import { useState } from "react";
import styles from "./auditLogs.module.scss";
import classNames from "classnames";
import Table from "@/app/ui/designSystem/table/Table";
import { Select, TextInput, Pagination } from "@trussworks/react-uswds";

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

  // Mock data array (replace with real API data)
  const logs = Array(243).fill({ name: "", action: "", date: "" }); // Placeholder for 243 entries

  // Calculate total pages based on logs.length and actionsPerPage
  const totalPages = Math.ceil(logs.length / actionsPerPage);

  return (
    <div className={classNames("main-container__wide", styles.mainContainer)}>
      <div className={classNames("grid-container grid-row", "margin-bottom-4")}>
        <h1 className="page-title grid-col-10">Audit Log</h1>
      </div>

      <div className={classNames("grid-row", "margin-bottom-3")}>
        <div className="grid-col-3">
          <TextInput
            name="name"
            id="name"
            placeholder="Name(s)"
            type="text"
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
          />
        </div>
        <div className="grid-col-3">
          <Select
            name="action"
            id="action"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
          >
            <option value="">Action(s)</option>
          </Select>
        </div>
        <div className="grid-col-3">
          <TextInput
            name="date"
            id="date"
            type="text"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="grid-col-3">
          <TextInput
            name="search"
            id="search"
            placeholder="Search name or action"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
  );
};

export default AuditLogs;
