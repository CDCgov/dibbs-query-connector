import { Bundle, FhirResource } from "fhir/r4";
import { UserGroupMembership } from "./users";
import { DibbsValueSet } from "./valuesets";

export interface CustomUserQuery {
  queryId: string;
  queryName: string;
  conditionsList?: string[];
  valuesets: DibbsValueSet[];
  groupAssignments?: UserGroupMembership[];
}

/**
 * The query response when the request source is from the Viewer UI.
 */
export type QueryResponse = {
  [R in FhirResource as R["resourceType"]]?: R[];
};

export type APIQueryResponse = Bundle;

export type PatientDiscoveryRequest = {
  fhirServer: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  mrn?: string;
  phone?: string;
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
};
export type PatientRecordsRequest = {
  patientId: string;
  fhirServer: string;
  queryName: string;
};

export type FullPatientRequest = PatientDiscoveryRequest &
  Omit<PatientRecordsRequest, "patientId">;
