import styles from "./auditLogs.module.scss";
import classNames from "classnames";
import Table from "@/app/ui/designSystem/table/Table";

/**
 * Client component for the Audit logs page.
 * @returns - The AuditLogs component.
 */
const AuditLogs: React.FC = () => {
  return (
    <>
      <div className={classNames("main-container__wide", styles.mainContainer)}>
        <div
          className={classNames(
            "grid-container grid-row padding-0",
            styles.titleContainer,
            "margin-bottom-4",
          )}
        >
          <h1 className="page-title grid-col-10">Audit Log</h1>
          <div className="grid-col-2 display-flex flex-column"></div>
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
      </div>
      ;
    </>
  );
};

export default AuditLogs;
