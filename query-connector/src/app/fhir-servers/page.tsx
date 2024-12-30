"use client"
import { Icon } from "@trussworks/react-uswds"
import { getFhirServerConfigs } from "../database-service";
import SiteAlert from "../query/designSystem/SiteAlert";
import Table from "../query/designSystem/Table";
import { useEffect, useState } from "react";
import { FhirServerConfig } from "../constants";

export default function FhirServers() {
  const [fhirServers, setFhirServers] = useState<FhirServerConfig[]>([]);
  useEffect(() => {
    getFhirServerConfigs(true).then((servers) => {
      setFhirServers(servers);
    });
  }, []);

  return (
    <>
      <SiteAlert />
      <div className="main-container__wide">
        <div className="grid-container grid-row padding-0">
          <h1 className="page-title grid-col-10">FHIR server configuration</h1>
          <div className="grid-col-2 display-flex flex-column">
            <button className="usa-button flex-align-self-end margin-top-3">
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
      </div >
    </>
  )
}
