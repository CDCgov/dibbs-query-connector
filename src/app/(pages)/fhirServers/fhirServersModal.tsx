import { ModalProps, ModalRef } from "@/app/ui/designSystem/modal/Modal";
import {
  Label,
  TextInput,
  Icon,
  Fieldset,
  Radio,
  Textarea,
} from "@trussworks/react-uswds";
import classNames from "classnames";
import dynamic from "next/dynamic";
import {
  Dispatch,
  JSX,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useReducer,
  useState,
} from "react";
import { AuthMethodType, FormError, ModalMode } from "./page";
import { FhirServerConfig } from "@/app/models/entities/fhir-servers";
import {
  AuthData,
  deleteFhirServer,
  getFhirServerConfigs,
  insertFhirServer,
  PatientMatchData,
  updateFhirServer,
  updateFhirServerConnectionStatus,
} from "@/app/backend/fhir-servers/service";
import {
  testFhirServerConnection,
  checkFhirServerSupportsMatch,
  validateFhirServerUrl,
} from "@/app/backend/fhir-servers/test-utils";
import Checkbox from "@/app/ui/designSystem/checkbox/Checkbox";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";

const Modal = dynamic<ModalProps>(
  () => import("../../ui/designSystem/modal/Modal").then((mod) => mod.Modal),
  { ssr: false },
);

const INITIAL_FORM_ERRORS = {
  serverName: false,
  url: false,
  bearerToken: false,
  clientId: false,
  clientSecret: false,
  tokenEndpoint: false,
  scopes: false,
  caCert: false,
};

const DEFAULT_PATIENT_MATCH_DATA = {
  enabled: false,
  onlySingleMatch: false,
  onlyCertainMatches: false,
  // If 0, the server decides how many matches to return.
  matchCount: 0,
  supportsMatch: false,
} as PatientMatchData;

const EMPTY_FHIR_SERVER = {
  name: "",
  id: "",
  hostname: "",
  disableCertValidation: false,
  defaultServer: false,
} as FhirServerConfig;

type FhirServersModal = {
  fhirServers: FhirServerConfig[];
  setFhirServers: Dispatch<SetStateAction<FhirServerConfig[]>>;
  modalMode: ModalMode;
  serverToEdit: FhirServerConfig | undefined;
  setSelectedFhirServer: Dispatch<SetStateAction<FhirServerConfig | undefined>>;
  patientMatchData?: PatientMatchData;
  setPatientMatchData: Dispatch<SetStateAction<PatientMatchData | undefined>>;
  modalRef: RefObject<ModalRef | null>;
};

interface ConnectionTestResult {
  success: boolean;
  error?: string;
}

interface HeaderPair {
  key: string;
  value: string;
  id: string; // For React key prop
}

interface UpdateFormAction {
  type: AuthMethodType | "common" | "reset" | "load";
  id?: string;
  authType?: AuthMethodType;
  name?: string;
  disableCertValidation?: boolean;
  defaultServer?: boolean;
  hostname?: string;
  headers?: Record<string, string>;
  clientId?: string;
  clientSecret?: string;
  tokenEndpoint?: string;
  scopes?: string;
  accessToken?: string;
  initialPayload?: FhirServerConfig;
  caCert?: string;
}

function formUpdateReducer(server: FhirServerConfig, action: UpdateFormAction) {
  switch (action.type) {
    case "none": {
      return server;
    }
    case "mutual-tls": {
      return {
        ...server,
        caCert: action.caCert ?? server.caCert,
      };
    }
    case "basic": {
      return {
        ...server,
        accessToken: action.accessToken ?? server.accessToken,
      };
    }
    case "client_credentials": {
      return {
        ...server,
        clientId: action.clientId ?? server.clientId,
        clientSecret: action.clientSecret ?? server.clientSecret,
        accessToken: action.accessToken ?? server.accessToken,
        scopes: action.scopes ?? server.scopes,
        tokenEndpoint: action.tokenEndpoint ?? server.tokenEndpoint,
      };
    }
    case "SMART": {
      return {
        ...server,
        clientId: action.clientId ?? server.clientId,
        scopes: action.scopes ?? server.scopes,
        tokenEndpoint: action.tokenEndpoint ?? server.tokenEndpoint,
      };
    }
    case "common": {
      const newAuthType = action.authType ?? server.authType;
      return {
        ...server,
        name: action.name ?? server.name,
        hostname: action.hostname ?? server.hostname,
        disableCertValidation:
          action.disableCertValidation ?? server.disableCertValidation,
        authType: newAuthType,
        defaultServer: action.defaultServer ?? server.defaultServer,
        // Clear caCert when switching away from mutual-tls
        caCert: newAuthType === "mutual-tls" ? server.caCert : undefined,
      };
    }
    case "reset": {
      return structuredClone(EMPTY_FHIR_SERVER);
    }

    case "load": {
      return action.initialPayload ?? server;
    }

    default:
      return server;
  }
}
type KeyOrValue = "key" | "value";
interface HeaderReducerAction {
  type: "update" | "delete" | "add" | "load" | "reset";
  id?: string;
  field?: KeyOrValue;
  value?: string;
  initialPayload?: HeaderPair[];
}

function headerReducer(headers: HeaderPair[], action: HeaderReducerAction) {
  switch (action.type) {
    case "update": {
      if (action.field && action.value) {
        return headers.map((header) =>
          header.id === action.id
            ? { ...header, [action.field as KeyOrValue]: action.value }
            : header,
        );
      }
      return headers;
    }
    case "delete": {
      return headers.filter((header) => header.id !== action.id);
    }
    case "add": {
      return [
        ...headers,
        { key: "", value: "", id: `${Date.now()}-${Math.random()}` },
      ];
    }
    case "load":
      return action.initialPayload ?? headers;
    case "reset":
      return [];
  }
}

export const FhirServersModal: React.FC<FhirServersModal> = ({
  setFhirServers,
  fhirServers,
  modalMode,
  serverToEdit,
  setSelectedFhirServer,
  patientMatchData,
  setPatientMatchData,
  modalRef,
}) => {
  const [server, serverDispatch] = useReducer(
    formUpdateReducer,
    EMPTY_FHIR_SERVER,
  );
  const [headers, headersDispatch] = useReducer(headerReducer, []);

  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const [errorMessage, setErrorMessage] = useState<string>();
  const [fhirVersion, setFhirVersion] = useState<string | null>(null);

  const [formError, setFormError] = useState<FormError>(
    structuredClone(INITIAL_FORM_ERRORS),
  );

  useEffect(() => {
    if (modalMode === "edit" && serverToEdit) {
      setConnectionStatus("idle");
      handlePatientMatchChange(
        serverToEdit.hostname,
        serverToEdit.disableCertValidation,
        getAuthData(),
      );

      serverDispatch({
        type: "load",
        initialPayload: serverToEdit,
      });

      // Set headers
      if (serverToEdit.headers) {
        const headerPairs: HeaderPair[] = Object.entries(serverToEdit.headers)
          .filter(([key]) => key !== "Authorization") // Filter out Authorization header
          .map(([key, value]) => ({
            key,
            value,
            id: `${Date.now()}-${Math.random()}`,
          }));

        headersDispatch({ type: "load", initialPayload: headerPairs });
      }
      // Set patient match data if available
      if (serverToEdit?.patientMatchConfiguration) {
        setPatientMatchData(serverToEdit.patientMatchConfiguration);
      } else {
        setPatientMatchData(DEFAULT_PATIENT_MATCH_DATA);
      }
    }
  }, [serverToEdit]);

  const handlePatientMatchChange = async (
    hostname: string,
    disableCertValidation: boolean,
    authData: AuthData,
  ) => {
    const { supportsMatch, fhirVersion } = await checkFhirServerSupportsMatch(
      hostname,
      disableCertValidation,
      authData,
    );

    setFhirVersion(fhirVersion);
    setPatientMatchData((prev) => ({
      enabled: prev?.enabled ?? false,
      onlySingleMatch: false,
      onlyCertainMatches: fhirVersion?.startsWith("6") ?? true,
      matchCount: prev?.matchCount ?? 0,
      supportsMatch: supportsMatch ?? false,
    }));
  };

  const testFhirConnection = async (
    url: string,
  ): Promise<ConnectionTestResult> => {
    if (!server) {
      showToastConfirmation({
        heading: "Something went wrong",
        body: "Couldn't set selected server. Try again, or contact us if the error persists",
        variant: "error",
      });
      return { success: false, error: "Selected server not set" };
    }
    try {
      // Build auth data based on selected auth method
      const authData = getAuthData();

      // Add auth-method specific properties
      if (server.authType === "basic") {
        authData.bearerToken = server.accessToken;
      } else if (server.authType === "client_credentials") {
        authData.clientId = server.clientId;
        authData.clientSecret = server.clientSecret;
        authData.tokenEndpoint = server.tokenEndpoint;
        authData.scopes = server.scopes;
      } else if (server.authType === "SMART") {
        authData.clientId = server.clientId;
        authData.tokenEndpoint = server.tokenEndpoint;
        authData.scopes = server.scopes;
      }

      const response = await testFhirServerConnection(
        url,
        server.disableCertValidation,
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

  const checkFormHasErrors = async () => {
    // shared fields
    const serverNameInvalid = server.name === "";
    let urlNameInvalid = false;
    try {
      await validateFhirServerUrl(server.hostname);
    } catch (e) {
      if (e instanceof Error) {
        setErrorMessage(e.message);
      }
      urlNameInvalid = true;
    }

    setFormError((prev) => {
      return {
        ...prev,
        url: urlNameInvalid,
        serverName: serverNameInvalid,
      };
    });

    if (urlNameInvalid || serverNameInvalid) return true;

    switch (server.authType) {
      case "basic":
        const bearerTokenInvalid = server.accessToken === "";
        setFormError((prev) => {
          return {
            ...prev,
            bearerToken: bearerTokenInvalid,
          };
        });
        return bearerTokenInvalid;

      case "client_credentials":
        const clientIdInvalid = !Boolean(server.clientId);
        const clientSecretInvalid = !Boolean(server.clientSecret);
        const scopesInvalid = !Boolean(server.scopes);

        setFormError((prev) => {
          return {
            ...prev,
            clientId: clientIdInvalid,
            clientSecret: clientSecretInvalid,
            scopes: scopesInvalid,
          };
        });
        return clientIdInvalid || clientSecretInvalid || scopesInvalid;

      case "SMART":
        const smartClientIdInvalid = !Boolean(server.clientId);
        const smartScopesInvalid = !Boolean(server.scopes);

        setFormError((prev) => {
          return {
            ...prev,
            clientId: smartClientIdInvalid,
            scopes: smartScopesInvalid,
          };
        });
        return smartClientIdInvalid || smartScopesInvalid;

      case "mutual-tls":
        // CA certificate is optional for mutual TLS
        return false;
    }
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

  const handleTestConnection = async (authData: AuthData) => {
    setConnectionStatus("idle");
    const formHasErrors = await checkFormHasErrors();

    if (formHasErrors) {
      console.error("Form missing required information");
      return;
    }

    // 1. Run connection test
    const result = await testFhirServerConnection(
      server?.hostname,
      server?.disableCertValidation,
      authData,
    );

    // 2. Independently check $match support
    const supportsMatch = await checkFhirServerSupportsMatch(
      server?.hostname,
      server?.disableCertValidation,
      authData,
    );

    // 3. Update connection status in DB
    const updateResult = await updateFhirServerConnectionStatus(
      server?.name,
      result.success,
    );

    // 4. Update frontend state
    setConnectionStatus(result.success ? "success" : "error");
    setErrorMessage(result.error);
    setPatientMatchData((prev) => ({
      enabled: prev?.enabled ?? false,
      onlySingleMatch: prev?.onlySingleMatch ?? false,
      onlyCertainMatches: prev?.onlyCertainMatches ?? false,
      matchCount: prev?.matchCount ?? 0,
      supportsMatch: supportsMatch.supportsMatch,
    }));

    if (updateResult.server) {
      setFhirServers((prev) =>
        prev.map((srv) =>
          srv.id === updateResult.server.id ? updateResult.server : srv,
        ),
      );
    }
  };

  const handleSave = async (authData: AuthData) => {
    const formHasErrors = await checkFormHasErrors();
    if (formHasErrors) {
      console.error("Form has validation errors");
      return;
    }
    const connectionResult = await testFhirConnection(server?.hostname);
    let result;
    if (modalMode === "create") {
      result = await insertFhirServer(
        server?.name,
        server?.hostname,
        server?.disableCertValidation ?? false,
        server?.defaultServer ?? false,
        connectionResult.success,
        authData,
        patientMatchData || DEFAULT_PATIENT_MATCH_DATA,
      );
    } else {
      result = await updateFhirServer({
        ...server,
        authData: authData,
      });

      if (server?.defaultServer) {
        await Promise.all(
          fhirServers
            .filter((srv) => srv.defaultServer && srv.name !== server.name)
            .map((srv) =>
              updateFhirServer({
                id: srv.id,
                name: srv.name,
                hostname: srv.hostname,
                disableCertValidation: srv.disableCertValidation,
                defaultServer: srv.defaultServer,
                lastConnectionSuccessful: srv.lastConnectionSuccessful ?? false,
                authData: {
                  authType: srv.authType as AuthMethodType,
                  clientId: srv.clientId,
                  clientSecret: srv.clientSecret,
                  tokenEndpoint: srv.tokenEndpoint,
                  scopes: srv.scopes,
                  headers: srv.headers ?? {},
                },
                patientMatchConfiguration:
                  srv.patientMatchConfiguration ?? DEFAULT_PATIENT_MATCH_DATA,
              }),
            ),
        );
      }
    }
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

  const handleDeleteServer = async () => {
    if (!server) {
      return;
    }

    const result = await deleteFhirServer(server.id);

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
        onClick: () => {
          void handleSave(getAuthData());
        },
      },
      {
        text: "Test connection" as string | JSX.Element,
        type: "button" as const,
        id: "modal-test-connection-button",
        className: "usa-button--secondary",
        onClick: () => {
          void handleTestConnection(getAuthData());
        },
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
        onClick: () => {
          void handleDeleteServer();
        },
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

  const convertHeadersToObject = (): Record<string, string> => {
    const headerObj: Record<string, string> = {};
    headers.forEach((header) => {
      if (header.key && header.value) {
        headerObj[header.key] = header.value;
      }
    });
    return headerObj;
  };

  // Helper to render auth method specific fields
  const renderAuthMethodFields = () => {
    switch (server.authType) {
      case "basic":
        return (
          <>
            <Label htmlFor="bearer-token">
              Bearer Token <span className="text-secondary">(required)</span>
            </Label>
            <TextInput
              id="bearer-token"
              name="bearer-token"
              type="text"
              className={classNames(
                "margin-top-05",
                formError?.bearerToken ? "error-input" : "",
              )}
              value={server.accessToken ?? ""}
              onChange={(e) =>
                serverDispatch({
                  type: "basic",
                  accessToken: e.target.value,
                })
              }
              required
            />

            {formError?.bearerToken && (
              <div className={"error-message margin-top-05"}>
                <Icon.Error
                  aria-label="warning icon indicating an error is present"
                  className={"error-message"}
                />
                Bearer token needs to be set for basic auth
              </div>
            )}
          </>
        );
      case "mutual-tls":
        return (
          <>
            <div className="usa-hint margin-top-05">
              Mutual TLS client certificates will be loaded from the keys
              directory or MTLS_CERT and MTLS_KEY environment variables.
              Optionally provide the CA certificate of the server here if it's
              not trusted by default.
            </div>
            <Label htmlFor="ca-cert">
              Server CA Certificate{" "}
              <span className="text-secondary">(optional)</span>
            </Label>
            <Textarea
              id="ca-cert"
              name="ca-cert"
              className={classNames(
                "margin-top-05",
                "maxw-none",
                formError?.caCert ? "error-input" : "",
              )}
              data-testid="ca-cert"
              value={server?.caCert ?? ""}
              onChange={(e) =>
                serverDispatch({
                  type: "mutual-tls",
                  caCert: e.target.value,
                })
              }
            />
          </>
        );
      case "client_credentials":
        return (
          <>
            <Label htmlFor="client-id">
              Client ID <span className="text-secondary">(required)</span>
            </Label>
            <TextInput
              id="client-id"
              name="client-id"
              className={classNames(
                "margin-top-05",
                formError?.clientId ? "error-input" : "",
              )}
              data-testid="client-id"
              type="text"
              value={server?.clientId ?? ""}
              onChange={(e) =>
                serverDispatch({
                  type: "client_credentials",
                  clientId: e.target.value,
                })
              }
              required
            />
            {formError?.clientId && (
              <div className={"error-message margin-top-05"}>
                <Icon.Error
                  aria-label="warning icon indicating an error is present"
                  className={"error-message"}
                />
                Client ID token needs to be set for client auth
              </div>
            )}

            <Label htmlFor="client-secret">
              Client Secret <span className="text-secondary">(required)</span>
            </Label>
            <TextInput
              id="client-secret"
              name="client-secret"
              className={classNames(
                "margin-top-05",
                formError?.clientId ? "error-input" : "",
              )}
              data-testid="client-secret"
              type="password"
              value={server?.clientSecret ?? ""}
              onChange={(e) =>
                serverDispatch({
                  type: "client_credentials",
                  clientSecret: e.target.value,
                })
              }
              required
            />
            {formError?.clientSecret && (
              <div className={"error-message margin-top-05"}>
                <Icon.Error
                  aria-label="warning icon indicating an error is present"
                  className={"error-message"}
                />
                Client secret needs to be set for client auth
              </div>
            )}
            <Label htmlFor="scopes">
              Scopes (space separated){" "}
              <span className="text-secondary">(required)</span>
            </Label>
            <TextInput
              id="scopes"
              className={classNames(
                "margin-top-05",
                formError?.scopes ? "error-input" : "",
              )}
              name="scopes"
              data-testid="scopes"
              type="text"
              value={server?.scopes ?? ""}
              onChange={(e) =>
                serverDispatch({
                  type: "client_credentials",
                  scopes: e.target.value,
                })
              }
              required
            />
            {formError?.scopes && (
              <div className={"error-message margin-top-05"}>
                <Icon.Error
                  aria-label="warning icon indicating an error is present"
                  className={"error-message"}
                />
                Scopes needs to be set for client auth
              </div>
            )}

            <Label htmlFor="token-endpoint">Token Endpoint</Label>
            <TextInput
              id="token-endpoint"
              className="margin-top-05"
              name="token-endpoint"
              data-testid="token-endpoint"
              type="url"
              value={server?.tokenEndpoint ?? ""}
              onChange={(e) =>
                serverDispatch({
                  type: "client_credentials",
                  tokenEndpoint: e.target.value,
                })
              }
              required
            />
          </>
        );
      case "SMART":
        return (
          <>
            <Label htmlFor="client-id">
              Client ID <span className="text-secondary">(required)</span>
            </Label>
            <TextInput
              id="client-id"
              className={classNames(
                "margin-top-05",
                formError?.clientId ? "error-input" : "",
              )}
              name="client-id"
              data-testid="client-id"
              type="text"
              value={server?.clientId ?? ""}
              onChange={(e) =>
                serverDispatch({
                  type: "SMART",
                  clientId: e.target.value,
                })
              }
              required
            />
            {formError?.clientId && (
              <div className={"error-message margin-top-05"}>
                <Icon.Error
                  aria-label="warning icon indicating an error is present"
                  className={"error-message"}
                />
                Client ID token needs to be set for SMART auth
              </div>
            )}

            <Label htmlFor="scopes">
              Scopes (space separated){" "}
              <span className="text-secondary">(required)</span>
            </Label>
            <div className="usa-hint margin-bottom-1 margin-top-05">
              For example: system/Patient.read system/Observation.read
            </div>
            <TextInput
              id="scopes"
              data-testid="scopes"
              className={classNames(
                "margin-top-05",
                formError?.scopes ? "error-input" : "",
              )}
              name="scopes"
              type="text"
              value={server?.scopes ?? ""}
              onChange={(e) =>
                serverDispatch({
                  type: "SMART",
                  scopes: e.target.value,
                })
              }
              required
            />
            {formError?.scopes && (
              <div className={"error-message margin-top-05"}>
                <Icon.Error
                  aria-label="warning icon indicating an error is present"
                  className={"error-message"}
                />
                Scopes needs to be set for SMART auth
              </div>
            )}

            <Label htmlFor="token-endpoint">Token Endpoint</Label>
            <div className="usa-hint margin-bottom-1 margin-top-05">
              If left empty, will be discovered from the server's
              .well-known/smart-configuration
            </div>
            <TextInput
              id="token-endpoint"
              name="token-endpoint"
              className="margin-top-05"
              data-testid="token-endpoint"
              type="url"
              value={server?.tokenEndpoint ?? ""}
              onChange={(e) =>
                serverDispatch({
                  type: "SMART",
                  tokenEndpoint: e.target.value,
                })
              }
            />
          </>
        );

      case "none":
      default:
        return null;
    }
  };

  const renderPatientMatchFields = () =>
    patientMatchData?.supportsMatch && (
      <div className="margin-top-1 padding-top-1">
        <h2 className="font-heading-lg margin-bottom-2">
          Patient $match settings
        </h2>

        <Checkbox
          id="match-enabled"
          data-testid="match-enabled"
          aria-label="Enable patient matching"
          label="Enable patient matching"
          className="margin-bottom-1"
          checked={patientMatchData?.enabled}
          onChange={(e) =>
            setPatientMatchData((prev) => ({
              ...prev!,
              enabled: e.target.checked,
              onlyCertainMatches: true,
            }))
          }
        />
        {
          <>
            {fhirVersion?.startsWith("6") && (
              <Fieldset>
                <Radio
                  id="match-type-single"
                  name="match-type"
                  value="single"
                  checked={patientMatchData?.onlySingleMatch}
                  label="Only include single matches"
                  aria-label="Only include single matches"
                  onChange={() =>
                    setPatientMatchData((prev) => ({
                      ...prev!,
                      onlyCertainMatches: false,
                      onlySingleMatch: true,
                      matchCount: 0,
                    }))
                  }
                />
                <Radio
                  id="match-type-multiple"
                  name="match-type"
                  value="multiple"
                  checked={patientMatchData?.onlyCertainMatches}
                  label="Only include certain matches"
                  aria-label="Only include certain matches"
                  onChange={() =>
                    setPatientMatchData((prev) => ({
                      ...prev!,
                      onlySingleMatch: false,
                      onlyCertainMatches: true,
                    }))
                  }
                />
                <Radio
                  id="match-type-all"
                  name="match-type"
                  value="all"
                  checked={
                    !patientMatchData?.onlyCertainMatches &&
                    !patientMatchData?.onlySingleMatch
                  }
                  label="Include all matches"
                  aria-label="Include all matches"
                  onChange={() =>
                    setPatientMatchData((prev) => ({
                      ...prev!,
                      onlyCertainMatches: false,
                      onlySingleMatch: false,
                    }))
                  }
                />
              </Fieldset>
            )}

            <Label htmlFor="match-count">
              Number of maximum patient matches to return. If 0, the server
              decides how many matches to return.
            </Label>
            <TextInput
              id="match-count"
              disabled={!patientMatchData?.enabled}
              data-testid="match-count"
              name="match-count"
              aria-label="Number of maximum patient matches to return. If 0, the server decides how many matches to return."
              type="number"
              min="0"
              max="200"
              value={patientMatchData?.matchCount}
              onChange={(e) =>
                setPatientMatchData((prev) => ({
                  ...prev!,
                  matchCount: Number(e.target.value),
                }))
              }
            />
          </>
        }
      </div>
    );

  const handleCloseModal = () => {
    resetModalState();
    modalRef.current?.toggleModal();
  };

  const getAuthData = (): AuthData => ({
    authType: server.authType ?? "none",
    headers: convertHeadersToObject(),
    bearerToken: server.authType === "basic" ? server.accessToken : undefined,
    clientId:
      server.authType &&
      ["client_credentials", "SMART"].includes(server.authType)
        ? server?.clientId
        : undefined,
    clientSecret:
      server.authType === "client_credentials"
        ? server?.clientSecret
        : undefined,
    tokenEndpoint:
      server.authType &&
      ["client_credentials", "SMART"].includes(server.authType)
        ? server?.tokenEndpoint
        : undefined,
    scopes:
      server.authType &&
      ["client_credentials", "SMART"].includes(server.authType)
        ? server?.scopes
        : undefined,
    caCert: server.authType === "mutual-tls" ? server?.caCert : undefined,
  });

  const resetModalState = () => {
    serverDispatch({
      type: "reset",
    });
    headersDispatch({ type: "reset" });
    setConnectionStatus("idle");
    setErrorMessage("");
    setPatientMatchData(DEFAULT_PATIENT_MATCH_DATA);
    setFormError(structuredClone(INITIAL_FORM_ERRORS));
    setSelectedFhirServer(undefined);
  };

  useEffect(() => {
    window.addEventListener("mousedown", clearErrorOnModalClose);
    window.addEventListener("keyup", clearErrorOnModalClose);

    // Cleanup
    return () => {
      window.removeEventListener("mousedown", clearErrorOnModalClose);
      window.removeEventListener("keyup", clearErrorOnModalClose);
    };
  }, [clearErrorOnModalClose]);

  return (
    <Modal
      id="fhir-server"
      heading={modalMode === "create" ? "New server" : "Edit server"}
      modalRef={modalRef}
      buttons={getModalButtons()}
      errorMessage={errorMessage}
      isLarge
    >
      <Label htmlFor="server-name">
        Server name <span className="text-secondary">(required)</span>
      </Label>
      <TextInput
        id="server-name"
        data-testid="server-name"
        className={classNames(
          "margin-top-05",
          formError?.serverName ? "error-input" : "",
        )}
        name="server-name"
        type="text"
        value={server.name}
        onChange={(e) =>
          serverDispatch({
            type: "common",
            name: e.target.value,
          })
        }
        required
      />
      {formError?.serverName && (
        <div className={"error-message margin-top-05"}>
          <Icon.Error
            aria-label="warning icon indicating an error is present"
            className={"error-message"}
          />
          Enter a server URL to query.
        </div>
      )}

      <Label htmlFor="server-url">
        URL <span className="text-secondary">(required)</span>
      </Label>
      <TextInput
        id="server-url"
        data-testid="server-url"
        name="server-url"
        className={classNames(
          "margin-top-05",
          formError?.url ? "error-input" : "",
        )}
        type="url"
        value={server?.hostname ?? ""}
        onChange={(e) =>
          serverDispatch({
            type: "common",
            hostname: e.target.value,
          })
        }
        required
      />
      {formError?.url && (
        <div className={"error-message margin-top-05"}>
          <Icon.Error
            aria-label="warning icon indicating an error is present"
            className={"error-message"}
          />
          {errorMessage
            ? `Fix the following server URL error: ${errorMessage}`
            : `Enter a valid server URL.`}
        </div>
      )}
      <Label htmlFor="auth-method">Auth Method</Label>
      <select
        className="usa-select margin-top-05"
        id="auth-method"
        data-testid="auth-method"
        name="auth-method"
        value={server.authType}
        onChange={(e) => {
          serverDispatch({
            type: "common",
            authType: (e.target.value as AuthMethodType) ?? "none",
          });
        }}
      >
        <option value="none">None</option>
        <option value="basic">Basic auth (bearer token)</option>
        <option value="client_credentials">Client Credentials</option>
        <option value="SMART">SMART on FHIR</option>
        <option value="mutual-tls">Mutual TLS</option>
      </select>

      {renderAuthMethodFields()}
      {renderPatientMatchFields()}

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
                  headersDispatch({
                    type: "update",
                    id: header.id,
                    value: e.target.value,
                    field: "key",
                  })
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
                  headersDispatch({
                    type: "update",
                    id: header.id,
                    value: e.target.value,
                    field: "value",
                  })
                }
              />
            </div>
            <div className="grid-col margin-left-2">
              <button
                type="button"
                className="usa-button usa-modal__close margin-top-2"
                onClick={() =>
                  headersDispatch({
                    type: "delete",
                    id: header.id,
                  })
                }
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
          onClick={() =>
            headersDispatch({
              type: "add",
            })
          }
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
        checked={server?.disableCertValidation ?? false}
        onChange={(e) =>
          serverDispatch({
            type: "common",
            disableCertValidation: e.target.checked,
          })
        }
      />

      <Checkbox
        id="default-server"
        label="Default server?"
        checked={server?.defaultServer ?? false}
        onChange={(e) =>
          serverDispatch({
            type: "common",
            defaultServer: e.target.checked,
          })
        }
      />
    </Modal>
  );
};
