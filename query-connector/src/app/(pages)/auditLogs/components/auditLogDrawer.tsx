"use client";

import React from "react";
import Drawer from "@/app/ui/designSystem/drawer/Drawer";
import { LogEntry } from "@/app/backend/dbServices/audit-logs";
import styles from "../auditLogs.module.scss";
import { auditLogActionTypeMap, auditLogUserMap } from "./auditLogMaps";

type AuditLogDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  log: LogEntry | null;
};

type JSONPrimitive = string | number | boolean | null;
type JSONValue = JSONPrimitive | JSONObject | JSONArray;
interface JSONObject {
  [key: string]: JSONValue;
}
interface JSONArray extends Array<JSONValue> {}

function parseNestedJSON(value: JSONValue): JSONValue {
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return parseNestedJSON(parsed as JSONValue);
    } catch {
      return value;
    }
  } else if (Array.isArray(value)) {
    return value.map(parseNestedJSON) as JSONArray;
  } else if (value !== null && typeof value === "object") {
    const result: JSONObject = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = parseNestedJSON(val as JSONValue);
    }
    return result;
  }
  return value;
}

/**
 * AuditLogDrawer component to display full JSON request of an audit log entry.
 * @param root0 - props
 * @param root0.isOpen - Boolean to control the visibility of the drawer.
 * @param root0.onClose - Function to handle closing the drawer.
 * @param root0.log - The log entry object containing name, action, and date.
 * @returns The AuditLogDrawer component.
 */
const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({
  isOpen,
  onClose,
  log,
}) => {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Full JSON request"
      placeholder="Search audit log entry"
      toRender={
        log ? (
          <div>
            <div className={styles.auditLogDrawerTitle}>
              <div>
                {auditLogUserMap(log.author)} ·{" "}
                {auditLogActionTypeMap[log.actionType]?.format(log)
                  ? auditLogActionTypeMap[log.actionType].format(log)
                  : log.actionType}
              </div>
              <div>{log.createdAt.toLocaleString()}</div>
            </div>
            <div className={styles.auditLogDrawerContainer}>
              <pre className={styles.auditLogDrawerBody}>
                {JSON.stringify(parseNestedJSON(log.auditMessage), null, 2)}
              </pre>
            </div>
          </div>
        ) : null
      }
      onSave={() => {}}
      toastMessage=""
      drawerWidth="60%"
    />
  );
};

export default AuditLogDrawer;
