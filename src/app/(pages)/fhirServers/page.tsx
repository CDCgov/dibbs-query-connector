"use client";

import { Icon, Tag } from "@trussworks/react-uswds";

import { useEffect, useRef, useState } from "react";
import styles from "./fhirServers.module.scss";
import classNames from "classnames";
import Table from "../../ui/designSystem/table/Table";

import WithAuth from "@/app/ui/components/withAuth/WithAuth";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { FhirServerConfig } from "@/app/models/entities/fhir-servers";
import {
  getFhirServerConfigs,
  PatientMatchData,
} from "@/app/backend/fhir-servers/service";
import { FhirServersModal } from "./fhirServersModal";
import { ModalRef } from "@/app/ui/designSystem/modal/Modal";

export type AuthMethodType =
  | "none"
  | "basic"
  | "client_credentials"
  | "SMART"
  | "mutual-tls";

export type FormError = {
  [tokenField: string]: boolean;
};

export type ModalMode = "create" | "edit";

/**
 * Client side parent component for the FHIR servers page. It displays a list of FHIR servers
 * @returns - The FhirServers component.
 */
const FhirServers: React.FC = () => {
  // State declarations
  const [fhirServers, setFhirServers] = useState<FhirServerConfig[]>([]);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedFhirServer, setSelectedFhirServer] = useState<
    FhirServerConfig | undefined
  >(undefined);
  const [patientMatchData, setPatientMatchData] = useState<PatientMatchData>();
  const modalRef = useRef<ModalRef>(null);

  useEffect(() => {
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
    fetchFHIRServers();
  }, []);

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
              onClick={() => {
                setSelectedFhirServer(undefined);
                setModalMode("create");
                modalRef.current?.toggleModal();
              }}
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
                    {fhirServer.authType === "mutual-tls" ? (
                      <Tag className="margin-left-2">mTLS</Tag>
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
                            className="usa-icon margin-right-05 error-message"
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
                        onClick={() => {
                          setSelectedFhirServer(fhirServer);
                          setModalMode("edit");
                          modalRef.current?.toggleModal();
                        }}
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

        <FhirServersModal
          modalRef={modalRef}
          setFhirServers={setFhirServers}
          setSelectedFhirServer={setSelectedFhirServer}
          fhirServers={fhirServers}
          modalMode={modalMode}
          serverToEdit={selectedFhirServer}
          patientMatchData={patientMatchData}
          setPatientMatchData={setPatientMatchData}
        ></FhirServersModal>
      </div>
    </WithAuth>
  );
};

export default FhirServers;
