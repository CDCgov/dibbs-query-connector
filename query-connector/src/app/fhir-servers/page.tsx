"use client";

import { Icon, Label, TextInput } from "@trussworks/react-uswds";
import {
  deleteFhirServer,
  getFhirServerConfigs,
  insertFhirServer,
  updateFhirServer,
} from "../database-service";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import { FhirServerConfig } from "../constants";
import type { ModalRef } from "../query/designSystem/modal/Modal";
import styles from "./fhirServers.module.scss";
import classNames from "classnames";
import SiteAlert from "../query/designSystem/SiteAlert";
import Table from "../query/designSystem/table/Table";

// Dynamic import with proper typing for Modal
import type { ModalProps } from "../query/designSystem/modal/Modal";
const Modal = dynamic<ModalProps>(
  () => import("../query/designSystem/modal/Modal").then((mod) => mod.Modal),
  { ssr: false },
);

type ModalMode = "create" | "edit";

/**
 * Client side parent component for the FHIR servers page. It displays a list of FHIR servers
 * @returns - The FhirServers component.
 */
const FhirServers: React.FC = () => {
  // State declarations
  const [isClient, setIsClient] = useState(false);
  const [fhirServers, setFhirServers] = useState<FhirServerConfig[]>([]);
  const [serverName, setServerName] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>("");
  const [selectedServer, setSelectedServer] = useState<FhirServerConfig | null>(
    null,
  );
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const modalRef = useRef<ModalRef>(null);

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch FHIR servers
  useEffect(() => {
    if (isClient) {
      getFhirServerConfigs(true).then((servers) => {
        setFhirServers(servers);
      });
    }
  }, [isClient]);

  const resetModalState = () => {
    setServerName("");
    setServerUrl("");
    setConnectionStatus("idle");
    setErrorMessage("");
    setSelectedServer(null);
  };

  const handleOpenModal = (mode: ModalMode, server?: FhirServerConfig) => {
    setModalMode(mode);
    if (mode === "edit" && server) {
      setSelectedServer(server);
      setServerName(server.name);
      setServerUrl(server.hostname);
      setConnectionStatus("idle");
    } else {
      resetModalState();
    }
    modalRef.current?.toggleModal();
  };

  const handleCloseModal = () => {
    resetModalState();
    modalRef.current?.toggleModal();
  };

  interface ConnectionTestResult {
    success: boolean;
    error?: string;
  }

  const testFhirConnection = async (
    url: string,
  ): Promise<ConnectionTestResult> => {
    if (!isClient)
      return { success: false, error: "Client-side only operation" };

    try {
      const baseUrl = url.replace(/\/$/, "");
      const metadataUrl = `${baseUrl}/metadata`;

      const response = await fetch(metadataUrl, {
        method: "GET",
        headers: {
          Accept: "application/fhir+json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.resourceType === "CapabilityStatement") {
          return { success: true };
        } else {
          return {
            success: false,
            error:
              "Invalid FHIR server response: Server did not return a valid CapabilityStatement",
          };
        }
      } else {
        let errorMessage: string;
        switch (response.status) {
          case 401:
            errorMessage =
              "Connection failed: Authentication required. Please check your credentials.";
            break;
          case 403:
            errorMessage =
              "Connection failed: Access forbidden. You do not have permission to access this FHIR server.";
            break;
          case 404:
            errorMessage =
              "Connection failed: The FHIR server endpoint was not found. Please verify the URL.";
            break;
          case 408:
            errorMessage =
              "Connection failed: The request timed out. The FHIR server took too long to respond.";
            break;
          case 500:
            errorMessage =
              "Connection failed: Internal server error. The FHIR server encountered an unexpected condition.";
            break;
          case 502:
            errorMessage =
              "Connection failed: Bad gateway. The FHIR server received an invalid response from upstream.";
            break;
          case 503:
            errorMessage =
              "Connection failed: The FHIR server is temporarily unavailable or under maintenance.";
            break;
          case 504:
            errorMessage =
              "Connection failed: Gateway timeout. The upstream server did not respond in time.";
            break;
          default:
            errorMessage = `Connection failed: The FHIR server returned an error. (${response.status} ${response.statusText})`;
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      return {
        success: false,
        error:
          "Connection failed: Unable to reach the FHIR server. Please check if the URL is correct and the server is accessible.",
      };
    }
  };

  const handleTestConnection = async () => {
    const result = await testFhirConnection(serverUrl);
    setConnectionStatus(result.success ? "success" : "error");
    setErrorMessage(result.error);
  };

  const handleSave = async () => {
    if (!isClient) return;

    const connectionResult = await testFhirConnection(serverUrl);

    if (modalMode === "create") {
      const result = await insertFhirServer(
        serverName,
        serverUrl,
        connectionResult.success,
      );

      if (result.success) {
        getFhirServerConfigs(true).then((servers) => {
          setFhirServers(servers);
        });
        handleCloseModal();
      } else {
        setConnectionStatus("error");
        setErrorMessage(result.error);
      }
    } else if (selectedServer) {
      const result = await updateFhirServer(
        selectedServer.id,
        serverName,
        serverUrl,
        connectionResult.success,
      );

      if (result.success) {
        getFhirServerConfigs(true).then((servers) => {
          setFhirServers(servers);
        });
        handleCloseModal();
      } else {
        setConnectionStatus("error");
        setErrorMessage(result.error);
      }
    }
  };

  const handleDeleteServer = async () => {
    if (!isClient || !selectedServer) return;

    const result = await deleteFhirServer(selectedServer.id);

    if (result.success) {
      getFhirServerConfigs(true).then((servers) => {
        setFhirServers(servers);
      });
      handleCloseModal();
    } else {
      setConnectionStatus("error");
      setErrorMessage(result.error);
    }
  };

  const getModalButtons = () => {
    const buttons = [
      {
        text: modalMode === "create" ? "Add server" : "Save changes",
        type: "submit" as const,
        id: "modal-save-button",
        className: "usa-button",
        onClick: handleSave,
      },
      {
        text: "Test connection" as string | JSX.Element,
        type: "button" as const,
        id: "modal-test-connection-button",
        className: "usa-button usa-button--outline",
        onClick: handleTestConnection,
      },
      {
        text: "Cancel",
        type: "button" as const,
        id: "modal-cancel-button",
        className: "usa-button usa-button--outline shadow-none",
        onClick: handleCloseModal,
      },
    ];

    if (modalMode === "edit") {
      buttons.push({
        text: "Delete",
        type: "button" as const,
        id: "modal-delete-button",
        className: "usa-button usa-button--secondary",
        onClick: handleDeleteServer,
      });
    }

    switch (connectionStatus) {
      case "success":
        buttons[1].text = (
          <>
            <Icon.Check
              className="usa-icon"
              aria-label="Connected"
              color="green"
            />
            Success
          </>
        );
        buttons[1].className =
          "usa-button usa-button--outline shadow-none text-green padding-left-2 padding-right-2";
        break;
      default:
        buttons[1].text = "Test connection";
        buttons[1].className = "usa-button usa-button--outline";
        break;
    }

    return buttons;
  };

  // Show loading state or nothing during SSR
  if (!isClient) {
    return null;
  }

  return (
    <>
      <SiteAlert />
      <div className={classNames("main-container__wide", styles.mainContainer)}>
        <div
          className={classNames(
            "grid-container grid-row padding-0",
            styles.titleContainer,
          )}
        >
          <h1 className="page-title grid-col-10">FHIR server configuration</h1>
          <div className="grid-col-2 display-flex flex-column">
            <button
              className="usa-button flex-align-self-end margin-top-3"
              onClick={() => handleOpenModal("create")}
            >
              New server
            </button>
          </div>
        </div>

        <Table className="margin-top-4">
          <thead>
            <tr className={styles.fhirServersRow}>
              <th>FHIR server</th>
              <th>URL</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fhirServers.map((fhirServer) => (
              <tr
                key={fhirServer.id}
                className={classNames(
                  styles.fhirServersRow,
                  styles.tableRowHover,
                )}
              >
                <td>{fhirServer.name}</td>
                <td>{fhirServer.hostname}</td>
                <td>
                  <div className="grid-container grid-row padding-0 display-flex flex-align-center">
                    {fhirServer.last_connection_successful ? (
                      <>
                        <Icon.Check
                          size={3}
                          className="usa-icon margin-right-05"
                          aria-label="Connected"
                          color="green"
                        />
                        Connected
                      </>
                    ) : (
                      <>
                        <Icon.Close
                          size={3}
                          className="usa-icon margin-right-05"
                          aria-label="Not connected"
                          color="red"
                        />
                        Not connected
                      </>
                    )}
                    <span className={styles.lastChecked}>
                      (last checked:{" "}
                      {fhirServer.last_connection_attempt
                        ? new Date(
                            fhirServer.last_connection_attempt,
                          ).toLocaleString()
                        : "unknown"}
                      )
                    </span>
                    <button
                      className={classNames(
                        styles.editButton,
                        "usa-button usa-button--unstyled",
                      )}
                      onClick={() => handleOpenModal("edit", fhirServer)}
                      aria-label={`Edit ${fhirServer.name}`}
                    >
                      <Icon.Edit size={3} />
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Modal
          id="fhir-server"
          heading={modalMode === "create" ? "New server" : "Edit server"}
          modalRef={modalRef}
          buttons={getModalButtons()}
          errorMessage={errorMessage}
          isLarge
        >
          <Label htmlFor="server-name">Server name</Label>
          <TextInput
            id="server-name"
            name="server-name"
            type="text"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            required
          />
          <Label htmlFor="server-url">URL</Label>
          <TextInput
            id="server-url"
            name="server-url"
            type="url"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            required
          />
        </Modal>
      </div>
    </>
  );
};

export default FhirServers;
