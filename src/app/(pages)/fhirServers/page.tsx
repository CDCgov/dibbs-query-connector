"use client";

import { Icon, Label, Tag, TextInput } from "@trussworks/react-uswds";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef, JSX, useCallback } from "react";
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
import {
  testFhirServerConnection,
  checkFhirServerSupportsMatch,
} from "@/app/shared/testConnection";
import {
  getFhirServerConfigs,
  AuthData,
  PatientMatchData,
  insertFhirServer,
  updateFhirServer,
  deleteFhirServer,
  updateFhirServerConnectionStatus,
} from "@/app/backend/fhir-servers";

const Modal = dynamic<ModalProps>(
  () => import("../../ui/designSystem/modal/Modal").then((mod) => mod.Modal),
  { ssr: false },
);

type ModalMode = "create" | "edit";
type AuthMethodType = "none" | "basic" | "client_credentials" | "SMART";

interface HeaderPair {
  key: string;
  value: string;
  id: string; // For React key prop
}

/**
 * Client side parent component for the FHIR servers page. It displays a list of FHIR servers
 * @returns - The FhirServers component.
 */
const FhirServers: React.FC = () => {
  // State declarations
  const [fhirServers, setFhirServers] = useState<FhirServerConfig[]>([]);
  const [serverName, setServerName] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [authMethod, setAuthMethod] = useState<AuthMethodType>("none");
  const [bearerToken, setBearerToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [tokenEndpoint, setTokenEndpoint] = useState("");
  const [scopes, setScopes] = useState("");
  const [disableCertValidation, setDisableCertValidation] = useState(false);
  const [patientMatchData, setPatientMatchData] =
    useState<PatientMatchData | null>(null);
  const [defaultServer, setDefaultServer] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>("");
  const [selectedServer, setSelectedServer] = useState<FhirServerConfig | null>(
    null,
  );
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [headers, setHeaders] = useState<HeaderPair[]>([]);
  const modalRef = useRef<ModalRef>(null);

  // Fetch FHIR servers
  async function fetchFHIRServers() {
    try {
      const servers = await getFhirServerConfigs(true);
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
    setClientId("");
    setClientSecret("");
    setTokenEndpoint("");
    setScopes("");
    setConnectionStatus("idle");
    setDisableCertValidation(false);
    setDefaultServer(false);
    setErrorMessage("");
    setSelectedServer(null);
    setHeaders([]);
  };

  const handleOpenModal = (mode: ModalMode, server?: FhirServerConfig) => {
    setModalMode(mode);
    if (mode === "edit" && server) {
      setSelectedServer(server);
      setServerName(server.name);
      setServerUrl(server.hostname);
      setConnectionStatus("idle");
      setDisableCertValidation(server.disableCertValidation);
      setDefaultServer(server.defaultServer);
      setErrorMessage("");

      // Set headers
      if (server.headers) {
        const headerPairs: HeaderPair[] = Object.entries(server.headers)
          .filter(([key]) => key !== "Authorization") // Filter out Authorization header
          .map(([key, value]) => ({
            key,
            value,
            id: `${Date.now()}-${Math.random()}`,
          }));
        setHeaders(headerPairs);
      } else {
        setHeaders([]);
      }
      // Set patient match data if available
      if (server?.patientMatchConfiguration) {
        setPatientMatchData(server.patientMatchConfiguration);
      } else {
        setPatientMatchData({
          enabled: false,
          onlyCertainMatches: false,
          matchCount: 0,
          supportsMatch: false,
        });
      }

      // Set auth method and corresponding fields based on server data
      if (server.authType) {
        setAuthMethod(server.authType as AuthMethodType);

        // Set other auth related fields
        if (server.clientId) setClientId(server.clientId);
        if (server.clientSecret) setClientSecret(server.clientSecret);
        if (server.tokenEndpoint) setTokenEndpoint(server.tokenEndpoint);
        if (server.scopes) setScopes(server.scopes);

        // For backward compatibility with basic auth
        if (server.authType === "basic" && server.headers?.Authorization) {
          setBearerToken(server.headers.Authorization.replace("Bearer ", ""));
        }
      } else if (server.headers?.Authorization?.startsWith("Bearer ")) {
        // Legacy support for servers without auth_type but with bearer token
        setAuthMethod("basic");
        setBearerToken(server.headers.Authorization.replace("Bearer ", ""));
      } else {
        setAuthMethod("none");
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

  const clearErrorOnModalClose = useCallback(
    (event: MouseEvent | KeyboardEvent) => {
      const clickTarget = (event.target as HTMLElement).getAttribute(
        "data-testid",
      );

      if (
        clickTarget == "modalOverlay" ||
        (event as KeyboardEvent).key == "Escape"
      ) {
        resetModalState();
      }
    },
    [],
  );

  useEffect(() => {
    window.addEventListener("mousedown", clearErrorOnModalClose);
    window.addEventListener("keyup", clearErrorOnModalClose);

    // Cleanup
    return () => {
      window.removeEventListener("mousedown", clearErrorOnModalClose);
      window.removeEventListener("keyup", clearErrorOnModalClose);
    };
  }, []);

  const addHeader = () => {
    setHeaders([
      ...headers,
      { key: "", value: "", id: `${Date.now()}-${Math.random()}` },
    ]);
  };

  const updateHeader = (id: string, field: "key" | "value", value: string) => {
    setHeaders(
      headers.map((header) =>
        header.id === id ? { ...header, [field]: value } : header,
      ),
    );
  };

  const removeHeader = (id: string) => {
    setHeaders(headers.filter((header) => header.id !== id));
  };

  const convertHeadersToObject = (): Record<string, string> => {
    const headerObj: Record<string, string> = {};
    headers.forEach((header) => {
      if (header.key && header.value) {
        headerObj[header.key] = header.value;
      }
    });
    return headerObj;
  };

  interface ConnectionTestResult {
    success: boolean;
    error?: string;
  }

  const testFhirConnection = async (
    url: string,
  ): Promise<ConnectionTestResult> => {
    try {
      // Build auth data based on selected auth method
      const authData: AuthData = {
        authType: authMethod,
        headers: convertHeadersToObject(), // Include custom headers
      };

      // Add auth-method specific properties
      if (authMethod === "basic") {
        authData.bearerToken = bearerToken;
      } else if (authMethod === "client_credentials") {
        authData.clientId = clientId;
        authData.clientSecret = clientSecret;
        authData.tokenEndpoint = tokenEndpoint;
        authData.scopes = scopes;
      } else if (authMethod === "SMART") {
        authData.clientId = clientId;
        authData.tokenEndpoint = tokenEndpoint;
        authData.scopes = scopes;
      }

      const response = await testFhirServerConnection(
        url,
        disableCertValidation,
        authData,
      );
      return response;
    } catch (error) {
      console.error("Error testing connection:", error);
      return {
        success: false,
        error: "Failed to test connection. Please try again.",
      };
    }
  };

  const handleTestConnection = async () => {
    // 1. Build auth data
    const authData: AuthData = {
      authType: authMethod,
      headers: convertHeadersToObject(),
      bearerToken: authMethod === "basic" ? bearerToken : undefined,
      clientId: ["client_credentials", "SMART"].includes(authMethod)
        ? clientId
        : undefined,
      clientSecret:
        authMethod === "client_credentials" ? clientSecret : undefined,
      tokenEndpoint: ["client_credentials", "SMART"].includes(authMethod)
        ? tokenEndpoint
        : undefined,
      scopes: ["client_credentials", "SMART"].includes(authMethod)
        ? scopes
        : undefined,
    };

    // 2. Run connection test
    const result = await testFhirServerConnection(
      serverUrl,
      disableCertValidation,
      authData,
    );

    // 3. Independently check $match support
    const supportsMatch = await checkFhirServerSupportsMatch(
      serverUrl,
      disableCertValidation,
      authData,
    );
    console.log("Supports $match:", supportsMatch);

    // 4. Update connection status in DB
    const updateResult = await updateFhirServerConnectionStatus(
      selectedServer?.name || serverName,
      result.success,
    );

    // 5. Update frontend state
    setConnectionStatus(result.success ? "success" : "error");
    setErrorMessage(result.error);
    setPatientMatchData((prev) => ({
      enabled: prev?.enabled ?? false,
      onlyCertainMatches: prev?.onlyCertainMatches ?? false,
      matchCount: prev?.matchCount ?? 0,
      supportsMatch,
    }));

    if (updateResult.server) {
      setFhirServers((prev) =>
        prev.map((srv) =>
          srv.id === updateResult.server.id ? updateResult.server : srv,
        ),
      );
    }
  };

  const handleSave = async () => {
    const connectionResult = await testFhirConnection(serverUrl);

    // Prepare auth data based on selected auth method
    const authData = {
      authType: authMethod,
      headers: convertHeadersToObject(),
      bearerToken: authMethod === "basic" ? bearerToken : undefined,
      clientId: ["client_credentials", "SMART"].includes(authMethod)
        ? clientId
        : undefined,
      clientSecret:
        authMethod === "client_credentials" ? clientSecret : undefined,
      tokenEndpoint: ["client_credentials", "SMART"].includes(authMethod)
        ? tokenEndpoint
        : undefined,
      scopes: ["client_credentials", "SMART"].includes(authMethod)
        ? scopes
        : undefined,
    };

    if (modalMode === "create") {
      const result = await insertFhirServer(
        serverName,
        serverUrl,
        disableCertValidation,
        defaultServer,
        connectionResult.success,
        authData,
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
        disableCertValidation,
        defaultServer,
        connectionResult.success,
        authData,
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
    if (!selectedServer) {
      return;
    }

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
        className: "usa-button--secondary",
        onClick: handleTestConnection,
      },
      {
        text: "Cancel",
        type: "button" as const,
        id: "modal-cancel-button",
        className: "usa-button--destructive",
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
              className="usa-icon success-primary"
              aria-label="Connected"
            />
            Success
          </>
        );
        buttons[1].className =
          "usa-button usa-button--secondary shadow-none text-green padding-left-2 padding-right-2";
        break;
      default:
        buttons[1].text = "Test connection";
        buttons[1].className = "usa-button usa-button--secondary";
        break;
    }

    return buttons;
  };

  // Helper to render auth method specific fields
  const renderAuthMethodFields = () => {
    switch (authMethod) {
      case "basic":
        return (
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
        );
      case "client_credentials":
        return (
          <>
            <Label htmlFor="client-id">Client ID</Label>
            <TextInput
              id="client-id"
              name="client-id"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            />

            <Label htmlFor="client-secret">Client Secret</Label>
            <TextInput
              id="client-secret"
              name="client-secret"
              data-testid="client-secret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              required
            />

            <Label htmlFor="token-endpoint">Token Endpoint</Label>
            <TextInput
              id="token-endpoint"
              name="token-endpoint"
              data-testid="token-endpoint"
              type="url"
              value={tokenEndpoint}
              onChange={(e) => setTokenEndpoint(e.target.value)}
              required
            />

            <Label htmlFor="scopes">Scopes (space separated)</Label>
            <TextInput
              id="scopes"
              name="scopes"
              data-testid="scopes"
              type="text"
              value={scopes}
              onChange={(e) => setScopes(e.target.value)}
              required
            />
          </>
        );
      case "SMART":
        return (
          <>
            <Label htmlFor="client-id">Client ID</Label>
            <TextInput
              id="client-id"
              name="client-id"
              data-testid="client-id"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            />

            <Label htmlFor="token-endpoint">Token Endpoint</Label>
            <div className="usa-hint margin-bottom-1">
              If left empty, will be discovered from the server's
              .well-known/smart-configuration
            </div>
            <TextInput
              id="token-endpoint"
              name="token-endpoint"
              data-testid="token-endpoint"
              type="url"
              value={tokenEndpoint}
              onChange={(e) => setTokenEndpoint(e.target.value)}
            />

            <Label htmlFor="scopes">Scopes (space separated)</Label>
            <div className="usa-hint margin-bottom-1">
              For example: system/Patient.read system/Observation.read
            </div>
            <TextInput
              id="scopes"
              data-testid="scopes"
              name="scopes"
              type="text"
              value={scopes}
              onChange={(e) => setScopes(e.target.value)}
              required
            />
          </>
        );
      case "none":
      default:
        return null;
    }
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
              <th>Auth Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fhirServers
              .slice()
              .sort((a, b) =>
                a.name.localeCompare(b.name, undefined, {
                  sensitivity: "base",
                }),
              ) // Sort by name
              .sort((a, b) =>
                b.defaultServer === true
                  ? 1
                  : a.defaultServer === true
                    ? -1
                    : 0,
              ) // Sort default server to the top
              .map((fhirServer) => (
                <tr
                  key={fhirServer.id}
                  className={classNames(styles.tableRowHover)}
                >
                  <td>
                    {fhirServer.name}{" "}
                    {fhirServer.defaultServer ? (
                      <Tag className="margin-left-2">DEFAULT</Tag>
                    ) : null}
                  </td>
                  <td>{fhirServer.hostname}</td>
                  <td>
                    {fhirServer.authType ||
                      (fhirServer.headers?.Authorization ? "basic" : "none")}
                  </td>
                  <td width={480}>
                    <div className="grid-container grid-row padding-0 display-flex flex-align-center">
                      {fhirServer.lastConnectionSuccessful ? (
                        <>
                          <Icon.Check
                            size={3}
                            className="usa-icon margin-right-05 success-primary"
                            aria-label="Connected"
                          />
                          Connected
                        </>
                      ) : (
                        <>
                          <Icon.Close
                            size={3}
                            className="usa-icon margin-right-05 error-primary"
                            aria-label="Not connected"
                          />
                          Not connected
                        </>
                      )}
                      <span className={styles.lastChecked}>
                        (last checked:{" "}
                        {fhirServer.lastConnectionAttempt
                          ? new Date(
                              fhirServer.lastConnectionAttempt,
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
            data-testid="server-name"
            name="server-name"
            type="text"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            required
          />
          <Label htmlFor="server-url">URL</Label>
          <TextInput
            id="server-url"
            data-testid="server-url"
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
            data-testid="auth-method"
            name="auth-method"
            value={authMethod}
            onChange={(e) => {
              setAuthMethod(e.target.value as AuthMethodType);
              // Reset fields when changing auth method
              if (e.target.value !== "basic") {
                setBearerToken("");
              }
              if (!["client_credentials", "SMART"].includes(e.target.value)) {
                setClientId("");
                setClientSecret("");
                setTokenEndpoint("");
                setScopes("");
              }
            }}
          >
            <option value="none">None</option>
            <option value="basic">Basic auth (bearer token)</option>
            <option value="client_credentials">Client Credentials</option>
            <option value="SMART">SMART on FHIR</option>
          </select>

          {renderAuthMethodFields()}

          {!!patientMatchData?.supportsMatch && (
            <div className="margin-top-4 border-top padding-top-2">
              <h2 className="font-heading-lg margin-bottom-2">
                Patient $match settings
              </h2>

              <Checkbox
                id="match-enabled"
                label="Enable patient matching"
                checked={patientMatchData.enabled}
                onChange={(e) =>
                  setPatientMatchData((prev) => ({
                    ...prev!,
                    enabled: e.target.checked,
                  }))
                }
              />

              <Checkbox
                id="match-only-certain"
                label="Only include certain matches"
                checked={patientMatchData.onlyCertainMatches}
                onChange={(e) =>
                  setPatientMatchData((prev) => ({
                    ...prev!,
                    onlyCertainMatches: e.target.checked,
                  }))
                }
              />

              <Label htmlFor="match-count">
                Number of patient matches to return
              </Label>
              <TextInput
                id="match-count"
                name="match-count"
                type="number"
                min="1"
                max="20"
                value={patientMatchData.matchCount}
                onChange={(e) =>
                  setPatientMatchData((prev) => ({
                    ...prev!,
                    matchCount: Number(e.target.value),
                  }))
                }
              />
            </div>
          )}

          <div className="margin-top-3" data-testid="custom-headers">
            <Label htmlFor="custom-headers">Custom Headers</Label>
            <div className="usa-hint margin-bottom-1">
              Add custom HTTP headers to be sent with every request to this FHIR
              server. Note: Authorization header is managed by the Auth Method
              above.
            </div>

            {headers.map((header, index) => (
              <div key={header.id} className="grid-row margin-bottom-2">
                <div className="grid-col-5">
                  <TextInput
                    id={`header-key-${index}`}
                    name={`header-key-${index}`}
                    type="text"
                    placeholder="Header name"
                    value={header.key}
                    onChange={(e) =>
                      updateHeader(header.id, "key", e.target.value)
                    }
                  />
                </div>
                <div className="grid-col-5 margin-left-2">
                  <TextInput
                    id={`header-value-${index}`}
                    name={`header-value-${index}`}
                    type="text"
                    placeholder="Header value"
                    value={header.value}
                    onChange={(e) =>
                      updateHeader(header.id, "value", e.target.value)
                    }
                  />
                </div>
                <div className="grid-col margin-left-2">
                  <button
                    type="button"
                    className="usa-button usa-modal__close margin-top-2"
                    onClick={() => removeHeader(header.id)}
                    aria-label={`Remove header ${header.key || "row"}`}
                  >
                    <Icon.Close
                      size={3}
                      className="usa-icon margin-right-05"
                      aria-label="Remove header"
                    />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="usa-button usa-button--secondary margin-top-1"
              onClick={addHeader}
            >
              <Icon.Add
                aria-label="Plus button to indicate header addition"
                size={3}
              />
              Add header
            </button>
          </div>

          <Checkbox
            id="disable-cert-validation"
            label="Disable certificate validation"
            checked={disableCertValidation}
            onChange={(e) => setDisableCertValidation(e.target.checked)}
          />

          <Checkbox
            id="default-server"
            label="Default server?"
            checked={defaultServer}
            onChange={(e) => setDefaultServer(e.target.checked)}
          />
        </Modal>
      </div>
    </WithAuth>
  );
};

export default FhirServers;
