import { Bundle, FhirResource, Patient } from "fhir/r4";
import { UserGroupMembership } from "./users";
import { DibbsValueSet } from "./valuesets";
import { MedicalRecordSections } from "@/app/(pages)/queryBuilding/utils";
import { PatientMatchData } from "@/app/backend/fhir-servers/service";

/**
 * Minimal saved-query representation for list/dropdown rendering, where the
 * full nested valueset data isn't needed.
 */
export interface QuerySummary {
  queryId: string;
  queryName: string;
}

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
  /** FHIR administrative-gender code: male | female | other | unknown */
  gender?: string;
  /** OMB race category code from urn:oid:2.16.840.1.113883.6.238 (e.g. 2106-3) */
  race?: string;
  /** OMB ethnicity category code from urn:oid:2.16.840.1.113883.6.238 (e.g. 2135-2) */
  ethnicity?: string;
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
  /**
   * The discovered Patient resource the records query is for. Immunization
   * Gateway servers translate FHIR searches into HL7v2 QBP queries, which
   * identify the patient by demographics rather than FHIR id, so the
   * Immunization search is built from this resource's name and birthDate.
   */
  patient?: Patient;
};

export type FullPatientRequest = PatientDiscoveryRequest &
  Omit<PatientRecordsRequest, "patientId" | "patient">;

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
