import Table from "../../../../ui/designSystem/table/Table";
import { Patient } from "fhir/r4";
import {
  formatAddress,
  formatContact,
  formatMRN,
  formatName,
} from "@/app/shared/format-service";
import classNames from "classnames";
import Skeleton from "react-loading-skeleton";

type PatientSearchResultsTableProps = {
  patients: Patient[];
  handlePatientSelect: (patient: Patient) => void;
  loading: boolean;
};

/**
 * Patient search results table for users to select which patient they want to
 * include in their query
 * @param param0 - props
 * @param param0.patients - Patient[] from the FHIR spec to display as rows
 * @param param0.handlePatientSelect - state setter function to redirect
 * to the results view
 * @param param0.loading -  whether the component is in a loading state
 * @returns The patient search results view
 */
const PatientSearchResultsTable: React.FC<PatientSearchResultsTableProps> = ({
  patients,
  handlePatientSelect: setPatientForQueryResponse,
  loading,
}) => {
  return (
    <>
      <h2 className="page-explainer">
        {loading ? <Skeleton width={250} /> : "The following record(s) match."}
      </h2>

      <Table className={classNames("margin-top-4")}>
        <thead>
          {loading ? (
            <LoadingTableHeader />
          ) : (
            <tr>
              <th>Name</th>
              <th>DOB</th>
              <th>Contact</th>
              <th>Address</th>
              <th>MRN</th>
              <th>Actions</th>
            </tr>
          )}
        </thead>
        <tbody>
          {loading ? (
            <LoadingTableBody />
          ) : (
            patients.map((patient) => (
              <tr
                key={patient.id}
                className={classNames("tableRowWithHover_clickable")}
                onClick={() => setPatientForQueryResponse(patient)}
              >
                <td>{formatName(patient.name ?? [])}</td>
                <td width={120}>{patient.birthDate ?? ""}</td>
                <td>{formatContact(patient.telecom ?? [])}</td>
                <td>{formatAddress(patient.address ?? [])}</td>
                <td width={150}>{formatMRN(patient.identifier ?? [])}</td>
                <td width={100}>
                  <a
                    href="#"
                    className="unchanged-color-on-visit"
                    onClick={() => setPatientForQueryResponse(patient)}
                  >
                    Select patient
                  </a>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </>
  );
};

export default PatientSearchResultsTable;

const LoadingTableHeader: React.FC = () => {
  return (
    <tr>
      {Array.from(Array(8).keys()).map((_) => {
        return (
          <th>
            <Skeleton />
          </th>
        );
      })}
    </tr>
  );
};

const LoadingTableBody: React.FC = () => {
  return (
    <tr className={classNames("tableRowWithHover_clickable")}>
      {Array.from(Array(7).keys()).map((_) => {
        return (
          <td>
            <Skeleton />
          </td>
        );
      })}
    </tr>
  );
};
