"use client"
import { Icon, Label, TextInput } from "@trussworks/react-uswds"
import { getFhirServerConfigs, insertFhirServer, updateFhirServer } from "../database-service";
import SiteAlert from "../query/designSystem/SiteAlert";
import Table from "../query/designSystem/table/Table";
import { useEffect, useState, useRef } from "react";
import { FhirServerConfig } from "../constants";
import { Modal, ModalRef } from "../query/designSystem/modal/Modal";
import styles from "./fhirServers.module.scss";
import classNames from "classnames";

export default function FhirServers() {
  const [fhirServers, setFhirServers] = useState<FhirServerConfig[]>([]);
  const [serverName, setServerName] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const modalRef = useRef<ModalRef>(null);
  const [selectedServer, setSelectedServer] = useState<FhirServerConfig | null>(null);
  const editModalRef = useRef<ModalRef>(null);

  useEffect(() => {
    getFhirServerConfigs(true).then((servers) => {
      setFhirServers(servers);
    });
  }, []);

  const handleOpenModal = () => {
    modalRef.current?.toggleModal();
  };

  const handleCloseModal = () => {
    setServerName("");
    setServerUrl("");
    setConnectionStatus('idle');
    setErrorMessage('');
    modalRef.current?.toggleModal();
  };

  interface ConnectionTestResult {
    success: boolean;
    error?: string;
  }

  /**
   * Tests a connection to a FHIR server
   * @param url - The URL of the FHIR server to test
   * @returns A promise that resolves to an object containing the test result
   */
  const testFhirConnection = async (url: string): Promise<ConnectionTestResult> => {
    try {
      const baseUrl = url.replace(/\/$/, '');
      const metadataUrl = `${baseUrl}/metadata`;

      const response = await fetch(metadataUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/fhir+json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.resourceType === 'CapabilityStatement') {
          return { success: true };
        } else {
          return {
            success: false,
            error: 'Invalid FHIR server response: Server did not return a valid CapabilityStatement'
          };
        }
      } else {
        let errorMessage: string;
        switch (response.status) {
          case 401:
            errorMessage = 'Connection failed: Authentication required. Please check your credentials.';
            break;
          case 403:
            errorMessage = 'Connection failed: Access forbidden. You do not have permission to access this FHIR server.';
            break;
          case 404:
            errorMessage = 'Connection failed: The FHIR server endpoint was not found. Please verify the URL.';
            break;
          case 408:
            errorMessage = 'Connection failed: The request timed out. The FHIR server took too long to respond.';
            break;
          case 500:
            errorMessage = 'Connection failed: Internal server error. The FHIR server encountered an unexpected condition.';
            break;
          case 502:
            errorMessage = 'Connection failed: Bad gateway. The FHIR server received an invalid response from upstream.';
            break;
          case 503:
            errorMessage = 'Connection failed: The FHIR server is temporarily unavailable or under maintenance.';
            break;
          case 504:
            errorMessage = 'Connection failed: Gateway timeout. The upstream server did not respond in time.';
            break;
          default:
            errorMessage = `Connection failed: The FHIR server returned an error. (${response.status} ${response.statusText})`;
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Connection failed: Unable to reach the FHIR server. Please check if the URL is correct and the server is accessible.'
      };
    }
  };

  const handleTestConnection = async () => {
    const result = await testFhirConnection(serverUrl);
    setConnectionStatus(result.success ? 'success' : 'error');
    setErrorMessage(result.error);
  };

  const handleAddServer = async () => {
    // First test the connection
    const connectionResult = await testFhirConnection(serverUrl);

    // Attempt to add the server regardless of connection result
    const result = await insertFhirServer(
      serverName,
      serverUrl,
      connectionResult.success
    );

    if (result.success) {
      // If server was added successfully, update the list
      getFhirServerConfigs(true).then((servers) => {
        setFhirServers(servers);
      });
      handleCloseModal();
    } else {
      setConnectionStatus('error');
      setErrorMessage(result.error);
    }
  };

  const modalButtons = [
    {
      text: "Add server",
      type: "submit" as const,
      id: "modal-add-server-button",
      className: "usa-button",
      onClick: handleAddServer,
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

  switch (connectionStatus) {
    case 'success':
      modalButtons[1].text = (
        <>
          <Icon.Check size={3} className="usa-icon" aria-label="Connected" color="green" />
          Connection successful
        </>
      )
      modalButtons[1].className = "usa-button usa-button--outline shadow-none text-green padding-left-0 padding-right-2"
      break;
    default:
  }

  const handleOpenEditModal = (server: FhirServerConfig) => {
    setSelectedServer(server);
    setServerName(server.name);
    setServerUrl(server.hostname);
    setConnectionStatus('idle');
    setErrorMessage('');
    editModalRef.current?.toggleModal();
  };

  const handleCloseEditModal = () => {
    setSelectedServer(null);
    setServerName("");
    setServerUrl("");
    setConnectionStatus('idle');
    setErrorMessage('');
    editModalRef.current?.toggleModal();
  };

  const handleUpdateServer = async () => {
    if (!selectedServer) return;

    // First test the connection
    const connectionResult = await testFhirConnection(serverUrl);

    // Attempt to update the server
    const result = await updateFhirServer(
      selectedServer.id,
      serverName,
      serverUrl,
      connectionResult.success
    );

    if (result.success) {
      // If server was updated successfully, update the list
      getFhirServerConfigs(true).then((servers) => {
        setFhirServers(servers);
      });
      handleCloseEditModal();
    } else {
      setConnectionStatus('error');
      setErrorMessage(result.error);
    }
  };

  const editModalButtons = [
    {
      text: "Save changes",
      type: "submit" as const,
      id: "modal-save-button",
      className: "usa-button",
      onClick: handleUpdateServer,
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
      onClick: handleCloseEditModal,
    },
    {
      text: "Delete",
      type: "button" as const,
      id: "modal-delete-button",
      className: "usa-button usa-button--secondary",
      onClick: () => {/* Implement delete functionality later */ },
    },
  ];

  switch (connectionStatus) {
    case 'success':
      editModalButtons[2].text = (
        <>
          <Icon.Check size={3} className="usa-icon" aria-label="Connected" color="green" />
          Connection successful
        </>
      )
      editModalButtons[2].className = "usa-button usa-button--outline shadow-none text-green padding-left-0 padding-right-2"
      break;
    default:
  }

  return (
    <>
      <SiteAlert />
      <div className={classNames("main-container__wide", styles.mainContainer)}>
        <div className={classNames("grid-container grid-row padding-0", styles.titleContainer)}>
          <h1 className="page-title grid-col-10">FHIR server configuration</h1>
          <div className="grid-col-2 display-flex flex-column">
            <button
              className="usa-button flex-align-self-end margin-top-3"
              onClick={handleOpenModal}
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
              <tr key={fhirServer.id} className={styles.fhirServersRow}>
                <td>{fhirServer.name}</td>
                <td>{fhirServer.hostname}</td>
                <td>
                  <div className="grid-container grid-row padding-0 display-flex flex-align-center">
                    {fhirServer.last_connection_successful ? (
                      <>
                        <Icon.Check size={3} className="usa-icon margin-right-05" aria-label="Connected" color="green" />
                        Connected
                      </>
                    ) : (
                      <>
                        <Icon.Close size={3} className="usa-icon margin-right-05" aria-label="Not connected" color="red" />
                        Not connected
                      </>
                    )}
                    <span className={styles.lastChecked}>
                      (last checked: {fhirServer.last_connection_attempt ? new Date(fhirServer.last_connection_attempt).toLocaleString() : 'unknown'})
                    </span>
                    <button
                      className={classNames(styles.editButton, "usa-button usa-button--unstyled")}
                      onClick={() => handleOpenEditModal(fhirServer)}
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
          id="new-fhir-server"
          heading="New server"
          modalRef={modalRef}
          buttons={modalButtons}
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
        <Modal
          id="edit-fhir-server"
          heading="Edit server"
          modalRef={editModalRef}
          buttons={editModalButtons}
          errorMessage={errorMessage}
          isLarge
        >
          <Label htmlFor="edit-server-name">Server name</Label>
          <TextInput
            id="edit-server-name"
            name="edit-server-name"
            type="text"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            required
          />
          <Label htmlFor="edit-server-url">URL</Label>
          <TextInput
            id="edit-server-url"
            name="edit-server-url"
            type="url"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            required
          />
        </Modal>
      </div >
    </>
  );
}
