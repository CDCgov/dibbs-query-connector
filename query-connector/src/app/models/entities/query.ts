import { Bundle, FhirResource } from "fhir/r4";
import { UserGroupMembership } from "./users";
import { DibbsValueSet } from "./valuesets";

export interface CustomUserQuery {
  query_id: string;
  query_name: string;
  conditions_list?: string[];
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
  fhir_server: string;
  first_name?: string;
  last_name?: string;
  dob?: string;
  mrn?: string;
  phone?: string;
};

export type PatientRecordsRequest = {
  patient_id: string;
  fhir_server: string;
  query_name: string;
};

export type FullPatientRequest = PatientDiscoveryRequest &
  Omit<PatientRecordsRequest, "patient_id">;
