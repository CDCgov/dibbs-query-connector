import { Bundle, FhirResource } from "fhir/r4";
import { UserGroupMembership } from "./users";
import { DibbsValueSet } from "./valuesets";
import { MedicalRecordSections } from "@/app/(pages)/queryBuilding/utils";
import { PatientMatchData } from "@/app/backend/fhir-servers";

export interface CustomUserQuery {
  queryId: string;
  queryName: string;
  conditionsList?: string[];
  medicalRecordSections?: MedicalRecordSections;
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
  address?: Address;
  email?: string;
  patientMatchConfiguration?: PatientMatchData;
};

export type Address = {
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

/**
 * Validates the patient search criteria for a discovery request.
 * @param request - The patient discovery request object.
 * @returns True if the search criteria is valid, false otherwise.
 */
export function validatedPatientSearch(
  request: PatientDiscoveryRequest,
): boolean {
  const { firstName, lastName, dob, mrn, phone, email, address } = request;
  if (!firstName || !lastName || !dob) {
    return false;
  }

  const hasMRN = !!mrn;
  const hasPhone = !!phone;
  const hasEmail = !!email;

  let hasCompleteAddress = false;
  if (address) {
    hasCompleteAddress =
      !!address.street1 && !!address.city && !!address.state && !!address.zip;
  }

  return hasMRN || hasCompleteAddress || hasPhone || hasEmail;
}
