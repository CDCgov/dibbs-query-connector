"use client";

import React from "react";
import Drawer from "@/app/ui/designSystem/drawer/Drawer";
import styles from "./resultsView.module.scss";
import { PatientRecordsResponse } from "../../../../backend/query-execution";
import { Icon, Button } from "@trussworks/react-uswds";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";

type ResultsViewDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  patientRecordsResponse: PatientRecordsResponse | undefined;
};

/**
 * Recursively pretty-prints nested JSON in a safe way, handling strings that might be stringified JSON.
 * @param value - Any value from PatientRecordsResponse
 * @returns Parsed JSON object or value
 */
function parseNestedJSON(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parseNestedJSON(parsed);
    } catch {
      return value;
    }
  } else if (Array.isArray(value)) {
    return value.map(parseNestedJSON);
  } else if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = parseNestedJSON(val);
    }
    return result;
  }
  return value;
}

/**
 * PatientRecordsDrawer component to display patientRecordsResponse in JSON format.
 * @param root0 - The props object.
 * @param root0.isOpen - Controls drawer visibility
 * @param root0.onClose - Closes the drawer
 * @param root0.patientRecordsResponse - FHIR response data to render as JSON
 * @returns The PatientRecordsDrawer component
 */
const ResultsViewDrawer: React.FC<ResultsViewDrawerProps> = ({
  isOpen,
  onClose,
  patientRecordsResponse,
}) => {
  const jsonStr = patientRecordsResponse
    ? JSON.stringify(parseNestedJSON(patientRecordsResponse), null, 2)
    : "";

  function handleCopy() {
    if (!jsonStr) return;
    navigator.clipboard.writeText(jsonStr);
    showToastConfirmation({ body: "Response copied to clipboard" });
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="display-flex flex-align-center flex-justify">
          <span>Full FHIR response</span>
          <Button
            type="button"
            unstyled
            className="usa-button--unstyled text-bold text-no-underline margin-left-auto"
            onClick={handleCopy}
            aria-label="Copy FHIR response"
          >
            <span className="icon-text display-flex flex-align-center">
              <Icon.ContentCopy className="height-3 width-3" />
              <span className="padding-left-05">Copy response</span>
            </span>
          </Button>
        </div>
      }
      placeholder="Search patient record"
      toRender={
        patientRecordsResponse ? (
          <div className={styles.resultsDrawerContainer}>
            <div className="display-flex flex-justify-end width-full"></div>
            <pre className={styles.resultsDrawerBody}>{jsonStr}</pre>
          </div>
        ) : (
          <div className={styles.resultsDrawerContainer}>
            <em>No FHIR response loaded.</em>
          </div>
        )
      }
      onSave={() => {}}
      drawerWidth="60%"
    />
  );
};

export default ResultsViewDrawer;
