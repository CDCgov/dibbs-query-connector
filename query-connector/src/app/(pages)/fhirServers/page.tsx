"use client";

import { Icon, Label, TextInput } from "@trussworks/react-uswds";
import {
  insertFhirServer,
  updateFhirServer,
  deleteFhirServer,
  getFhirServerConfigs,
} from "@/app/backend/dbServices/fhir-servers";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import type { ModalRef } from "../../ui/designSystem/modal/Modal";
import styles from "./fhirServers.module.scss";
import classNames from "classnames";
import Table from "../../ui/designSystem/table/Table";
import Checkbox from "../../ui/designSystem/checkbox/Checkbox";

// Dynamic import with proper typing for Modal
import type { ModalProps } from "../../ui/designSystem/modal/Modal";

import WithAuth from "@/app/ui/components/withAuth/WithAuth";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { FhirServerConfig } from "@/app/models/entities/fhir-servers";

const Modal = dynamic<ModalProps>(
  () => import("../../ui/designSystem/modal/Modal").then((mod) => mod.Modal),
  { ssr: false },
);

type ModalMode = "create" | "edit";

/**
 * Client side parent component for the FHIR servers page. It displays a list of FHIR servers
 * @returns - The FhirServers component.
 */
const FhirServers: React.FC = () => {
  // State declarations
  const [fhirServers, setFhirServers] = useState<FhirServerConfig[]>([]);
  const [serverName, setServerName] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [authMethod, setAuthMethod] = useState<"none" | "basic">("none");
  const [bearerToken, setBearerToken] = useState("");
  const [disableCertValidation, setDisableCertValidation] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>("");
  const [selectedServer, setSelectedServer] = useState<FhirServerConfig | null>(
    null,
  );
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const modalRef = useRef<ModalRef>(null);

  // Fetch FHIR servers
  async function fetchFHIRServers() {
    try {
      const servers = await getFhirServerConfigs(true, true);
      setFhirServers(servers);
    } catch (e) {
      showToastConfirmation({
        body: "Unable to retrieve FHIR Server Configurations. Please try again.",
        variant: "error",
      });
      console.error(e);
    }
  }

  useEffect(() => {
    fetchFHIRServers();
  }, []);

  const resetModalState = () => {
    setServerName("");
    setServerUrl("");
    setAuthMethod("none");
    setBearerToken("");
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
      setDisableCertValidation(server.disable_cert_validation);

      // Set auth method and bearer token if they exist
      if (server.headers?.Authorization?.startsWith("Bearer ")) {
        setAuthMethod("basic");
        setBearerToken(server.headers.Authorization.replace("Bearer ", ""));
      } else {
        setAuthMethod("none");
        setBearerToken("");
      }
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
    try {
      const response = await fetch("/api/test-fhir-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          bearerToken: authMethod === "basic" ? bearerToken : undefined,
        }),
      });

      const result = await response.json();
      return result;
    } catch {
      return {
        success: false,
        error: "Failed to test connection. Please try again.",
      };
    }
  };

  const handleTestConnection = async () => {
    const result = await testFhirConnection(serverUrl);
    setConnectionStatus(result.success ? "success" : "error");
    setErrorMessage(result.error);
  };

  const handleSave = async () => {
    const connectionResult = await testFhirConnection(serverUrl);

    if (modalMode === "create") {
      const result = await insertFhirServer(
        serverName,
        serverUrl,
        disableCertValidation,
        connectionResult.success,
        authMethod === "basic" ? bearerToken : undefined,
      );

      if (result.success) {
        getFhirServerConfigs(true, true).then((servers) => {
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
        disableCertValidation,
        connectionResult.success,
        authMethod === "basic" ? bearerToken : undefined,
      );

      if (result.success) {
        getFhirServerConfigs(true, true).then((servers) => {
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
    if (!selectedServer) {
      return;
    }

    const result = await deleteFhirServer(selectedServer.id);

    if (result.success) {
      getFhirServerConfigs(true, true).then((servers) => {
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

  return (
    <WithAuth>
      <div className={classNames("main-container__wide", styles.mainContainer)}>
        <div
          className={classNames(
            "grid-container grid-row padding-0",
            styles.titleContainer,
            "margin-bottom-4",
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

        <Table fullWidth>
          <thead>
            <tr>
              <th>FHIR server</th>
              <th>URL</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fhirServers.map((fhirServer) => (
              <tr
                key={fhirServer.id}
                className={classNames(styles.tableRowHover)}
              >
                <td>{fhirServer.name}</td>
                <td>{fhirServer.hostname}</td>
                <td width={480}>
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
                      <Icon.Edit aria-label="edit" size={3} />
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
          <Label htmlFor="auth-method">Auth Method</Label>
          <select
            className="usa-select"
            id="auth-method"
            name="auth-method"
            value={authMethod}
            onChange={(e) => {
              setAuthMethod(e.target.value as "none" | "basic");
              if (e.target.value === "none") {
                setBearerToken("");
              }
            }}
          >
            <option value="none">None</option>
            <option value="basic">Basic auth</option>
          </select>
          {authMethod === "basic" && (
            <>
              <Label htmlFor="bearer-token">Bearer Token</Label>
              <TextInput
                id="bearer-token"
                name="bearer-token"
                type="text"
                value={bearerToken}
                onChange={(e) => setBearerToken(e.target.value)}
                required
              />
            </>
          )}
          <Checkbox
            id="disable-cert-validation"
            label="Disable certificate validation"
            checked={disableCertValidation}
            onChange={(e) => setDisableCertValidation(e.target.checked)}
          />
        </Modal>
      </div>
    </WithAuth>
  );
};

export default FhirServers;
