"use client"
import { Icon, Label, TextInput } from "@trussworks/react-uswds"
import { getFhirServerConfigs } from "../database-service";
import SiteAlert from "../query/designSystem/SiteAlert";
import Table from "../query/designSystem/Table";
import { useEffect, useState, useRef } from "react";
import { FhirServerConfig } from "../constants";
import { Modal, ModalRef } from "../query/designSystem/modal/Modal";
import { Connection } from "pg";
import fhirServers from "../fhir-servers";

export default function FhirServers() {
  const [fhirServers, setFhirServers] = useState<FhirServerConfig[]>([]);
  const [serverName, setServerName] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
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
        } else {
          console.error('Invalid FHIR server response: missing CapabilityStatement');
          setConnectionStatus('error');
        }
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Failed to connect to FHIR server:', error);
      setConnectionStatus('error');
    }
  };

  const handleAddServer = () => {
    // Implement server addition logic here
    console.log("Adding server:", { name: serverName, url: serverUrl });
    handleCloseModal();
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
