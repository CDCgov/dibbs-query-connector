import { Icon } from "@trussworks/react-uswds"
import { getFhirServerConfigs } from "../database-service";
import SiteAlert from "../query/designSystem/SiteAlert";
import Table from "../query/designSystem/Table";

export default async function FhirServers() {
  const fhirServerConfigs = await getFhirServerConfigs(true)

  return (
    <>
      <SiteAlert />
      <div className="main-container__wide">
        <h1 className="page-title">FHIR server configuration</h1>
        <Table className="margin-top-4">
          <thead>
            <tr>
              <th>FHIR server</th>
              <th>URL</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fhirServerConfigs.map((fhirServer) => (
              <tr key={fhirServer.id}>
                <td>{fhirServer.name}</td>
                <td>{fhirServer.hostname}</td>
                <td>
                  <Icon.Check size={3} className="usa-icon" aria-label="Connected" color="green" />{" "}
                  Connectedz
                </td>
              </tr>

            ))}
          </tbody>
        </Table>
      </div>
    </>
  )
}
