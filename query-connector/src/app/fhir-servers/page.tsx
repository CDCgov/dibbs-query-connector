"use client"
import { Icon, Label, TextInput } from "@trussworks/react-uswds"
import { getFhirServerConfigs, insertFhirServer } from "../database-service";
import SiteAlert from "../query/designSystem/SiteAlert";
import Table from "../query/designSystem/Table";
import { useEffect, useState, useRef } from "react";
import { FhirServerConfig } from "../constants";
import { Modal, ModalRef } from "../query/designSystem/modal/Modal";

export default function FhirServers() {
  const [fhirServers, setFhirServers] = useState<FhirServerConfig[]>([]);
  const [serverName, setServerName] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const modalRef = useRef<ModalRef>(null);

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

  const handleTestConnection = async () => {
    try {
      const baseUrl = serverUrl.replace(/\/$/, '');
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
          console.log('Successfully connected to FHIR server:', baseUrl);
          setConnectionStatus('success');
          setErrorMessage(undefined);
        } else {
          console.error('Invalid FHIR server response: missing CapabilityStatement');
          setConnectionStatus('error');
          setErrorMessage('Invalid FHIR server response: Server did not return a valid CapabilityStatement');
        }
      } else {
        setConnectionStatus('error');
        switch (response.status) {
          case 401:
            setErrorMessage('Connection failed: Authentication required. Please check your credentials.');
            break;
          case 403:
            setErrorMessage('Connection failed: Access forbidden. You do not have permission to access this FHIR server.');
            break;
          case 404:
            setErrorMessage('Connection failed: The FHIR server endpoint was not found. Please verify the URL.');
            break;
          case 408:
            setErrorMessage('Connection failed: The request timed out. The FHIR server took too long to respond.');
            break;
          case 500:
            setErrorMessage('Connection failed: Internal server error. The FHIR server encountered an unexpected condition.');
            break;
          case 502:
            setErrorMessage('Connection failed: Bad gateway. The FHIR server received an invalid response from upstream.');
            break;
          case 503:
            setErrorMessage('Connection failed: The FHIR server is temporarily unavailable or under maintenance.');
            break;
          case 504:
            setErrorMessage('Connection failed: Gateway timeout. The upstream server did not respond in time.');
            break;
          default:
            setErrorMessage(`Connection failed: The FHIR server returned an error. (${response.status} ${response.statusText})`);
        }
      }
    } catch (error) {
      console.error('Failed to connect to FHIR server:', error);
      setConnectionStatus('error');
      setErrorMessage('Connection failed: Unable to reach the FHIR server. Please check if the URL is correct and the server is accessible.');
    }
  };
  const handleAddServer = async () => {
    const result = await insertFhirServer(serverName, serverUrl);
    if (result.success) {
      // Refresh the server list
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
      text: "Cancel",
      type: "button" as const,
      id: "modal-cancel-button",
      className: "usa-button usa-button--outline shadow-none",
      onClick: handleCloseModal,
    },
    {
      text: "Test connection" as string | JSX.Element,
      type: "button" as const,
      id: "modal-test-connection-button",
      className: "usa-button usa-button--outline",
      onClick: handleTestConnection,
    },
    {
      text: "Add server",
      type: "submit" as const,
      id: "modal-add-server-button",
      className: "usa-button",
      onClick: handleAddServer,
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

  return (
    <>
      <SiteAlert />
      <div className="main-container__wide">
        <div className="grid-container grid-row padding-0">
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
            <tr>
              <th>FHIR server</th>
              <th>URL</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fhirServers.map((fhirServer) => (
              <tr key={fhirServer.id}>
                <td>{fhirServer.name}</td>
                <td>{fhirServer.hostname}</td>
                <td>
                  <div className="grid-container grid-row padding-0">
                    <Icon.Check size={3} className="usa-icon" aria-label="Connected" color="green" />
                    Connected
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
}
