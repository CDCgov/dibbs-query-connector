"use client";

import React, { useState } from "react";
import Drawer from "@/app/ui/designSystem/drawer/Drawer";
import TabGroup from "@/app/ui/designSystem/TabGroup/tabGroup";
import styles from "./resultsView.module.scss";
import { PatientRecordsResponse } from "../../../../backend/query-execution/service";
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
 * PatientRecordsDrawer component to display the outgoing FHIR requests and the
 * patientRecordsResponse payload in JSON format, under Request/Response tabs.
 * @param root0 - The props object.
 * @param root0.isOpen - Controls drawer visibility
 * @param root0.onClose - Closes the drawer
 * @param root0.patientRecordsResponse - FHIR response data (with captured requests) to render
 * @returns The PatientRecordsDrawer component
 */
const ResultsViewDrawer: React.FC<ResultsViewDrawerProps> = ({
  isOpen,
  onClose,
  patientRecordsResponse,
}) => {
  const [activeTab, setActiveTab] = useState<"request" | "response">(
    "response",
  );

  const fhirRequests = patientRecordsResponse?.fhirRequests;

  // The Response tab shows the FHIR payload without the captured requests.
  let responseStr = "";
  if (patientRecordsResponse) {
    const { fhirRequests: _omit, ...response } = patientRecordsResponse;
    responseStr = JSON.stringify(parseNestedJSON(response), null, 2);
  }

  // The Request tab lists each outgoing request as method + URL, with the
  // POST form body (when present) indented on the next line.
  const requestStr =
    fhirRequests && fhirRequests.length > 0
      ? fhirRequests
          .map((r) => `${r.method} ${r.url}${r.body ? `\n    ${r.body}` : ""}`)
          .join("\n\n")
      : "No FHIR requests recorded.";

  const activeStr = activeTab === "request" ? requestStr : responseStr;

  function handleCopy() {
    if (!activeStr) return;
    navigator.clipboard.writeText(activeStr);
    showToastConfirmation({ body: "Copied to clipboard" });
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="display-flex flex-align-center flex-justify">
          <span>FHIR request &amp; response</span>
          <Button
            type="button"
            unstyled
            className="usa-button--unstyled text-bold text-no-underline margin-left-auto"
            onClick={handleCopy}
            aria-label="Copy to clipboard"
          >
            <span className="icon-text display-flex flex-align-center">
              <Icon.ContentCopy
                aria-label="Icon indicating content is able to be copied to the clipboard"
                className="height-3 width-3"
              />
              <span className="padding-left-05">Copy</span>
            </span>
          </Button>
        </div>
      }
      placeholder="Search patient record"
      toRender={
        patientRecordsResponse ? (
          <div className={styles.resultsDrawerContainer}>
            <div className="width-full">
              <TabGroup
                initialTab="Response"
                tabs={[
                  {
                    label: "Request",
                    onClick: () => setActiveTab("request"),
                  },
                  {
                    label: "Response",
                    onClick: () => setActiveTab("response"),
                  },
                ]}
              />
            </div>
            <pre className={styles.resultsDrawerBody}>{activeStr}</pre>
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
