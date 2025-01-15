import {
  Patient,
  Observation,
  DiagnosticReport,
  Condition,
  Encounter,
  Medication,
  MedicationAdministration,
  MedicationRequest,
} from "fhir/r4";

export const USE_CASE_DETAILS = {
  "newborn-screening": {
    queryName: "Newborn screening follow-up",
    condition: "Newborn Screening",
  },
  syphilis: {
    queryName: "Syphilis case investigation",
    condition: "Congenital syphilis (disorder)",
  },
  gonorrhea: {
    queryName: "Gonorrhea case investigation",
    condition: "Gonorrhea (disorder)",
  },
  chlamydia: {
    queryName: "Chlamydia case investigation",
    condition: "Chlamydia trachomatis infection (disorder)",
  },
  cancer: {
    queryName: "Cancer case investigation",
    condition: "Cancer (Leukemia)",
  },
  immunization: {
    queryName: "Immunization",
    condition: "Immunization",
  },
} as const;

export type USE_CASES = keyof typeof USE_CASE_DETAILS;

//Create type to specify the demographic data fields for a patient
export type DemoDataFields = {
  FirstName: string;
  LastName: string;
  DOB: string;
  MRN: string;
  Phone: string;
  FhirServer: string;
  UseCase: USE_CASES;
};

/*Type to specify the different patient types*/
export type PatientType =
  | "cancer"
  | "sti-chlamydia-positive"
  | "sti-gonorrhea-positive"
  | "newborn-screening-technical-fail"
  | "newborn-screening-referral"
  | "newborn-screening-pass"
  | "sti-syphilis-positive";

export const DEFAULT_DEMO_FHIR_SERVER = "Public HAPI: Direct";
/*
 * Common "Hyper Unlucky" patient data used for all non-newborn screening use cases
 */
export const hyperUnluckyPatient: DemoDataFields = {
  FirstName: "Hyper",
  LastName: "Unlucky",
  DOB: "1975-12-06",
  MRN: "8692756",
  Phone: "517-425-1398",
  FhirServer: DEFAULT_DEMO_FHIR_SERVER,
  UseCase: "cancer", // UseCase will be updated per case
};

/*
Demo patient data used to populate the form fields with each value being a type of DemoDataFields
*/
export const demoData: Record<PatientType, DemoDataFields> = {
  cancer: { ...hyperUnluckyPatient, UseCase: "cancer" },
  "sti-chlamydia-positive": { ...hyperUnluckyPatient, UseCase: "chlamydia" },
  "sti-gonorrhea-positive": { ...hyperUnluckyPatient, UseCase: "gonorrhea" },
  "sti-syphilis-positive": { ...hyperUnluckyPatient, UseCase: "syphilis" },
  "newborn-screening-technical-fail": {
    FirstName: "Mango",
    LastName: "Smith",
    DOB: "2024-07-12",
    MRN: "67890",
    Phone: "555-123-4567",
    FhirServer: "HELIOS Meld: Direct",
    UseCase: "newborn-screening",
  },
  "newborn-screening-referral": {
    FirstName: "Watermelon",
    LastName: "McGee",
    DOB: "2024-07-12",
    MRN: "18091",
    Phone: "5555555555",
    FhirServer: "HELIOS Meld: Direct",
    UseCase: "newborn-screening",
  },
  "newborn-screening-pass": {
    FirstName: "Cucumber",
    LastName: "Hill",
    DOB: "2023-08-29",
    MRN: "18091",
    Phone: "",
    FhirServer: "CernerHelios: eHealthExchange",
    UseCase: "newborn-screening",
  },
};

// Define Option type
type Option = {
  value: string;
  label: string;
};

/* Labels and values for the patient options that are available based on the query option selected */
export const patientOptions: Record<string, Option[]> = {
  cancer: [{ value: "cancer", label: "A patient with leukemia" }],
  chlamydia: [
    {
      value: "sti-chlamydia-positive",
      label: "A male patient with a positive chlamydia lab test",
    },
  ],
  gonorrhea: [
    {
      value: "sti-gonorrhea-positive",
      label: "A male patient with a positive gonorrhea lab test",
    },
  ],
  "newborn-screening": [
    {
      value: "newborn-screening-technical-fail",
      label: "A newborn with a technical failure on screening",
    },
    {
      value: "newborn-screening-referral",
      label: "A newborn with a hearing referral & risk indicator",
    },
    {
      value: "newborn-screening-pass",
      label: "A newborn with a passed screening",
    },
  ],
  syphilis: [
    {
      value: "sti-syphilis-positive",
      label: "A patient with a positive syphilis lab test",
    },
  ],
};

/*Labels and values for the state options dropdown on the query page*/
export const stateOptions = [
  { value: "AL", label: "AL - Alabama" },
  { value: "AK", label: "AK - Alaska" },
  { value: "AS", label: "AS - American Samoa" },
  { value: "AZ", label: "AZ - Arizona" },
  { value: "AR", label: "AR - Arkansas" },
  { value: "CA", label: "CA - California" },
  { value: "CO", label: "CO - Colorado" },
  { value: "CT", label: "CT - Connecticut" },
  { value: "DE", label: "DE - Delaware" },
  { value: "DC", label: "DC - District of Columbia" },
  { value: "FL", label: "FL - Florida" },
  { value: "GA", label: "GA - Georgia" },
  { value: "GU", label: "GU - Guam" },
  { value: "HI", label: "HI - Hawaii" },
  { value: "ID", label: "ID - Idaho" },
  { value: "IL", label: "IL - Illinois" },
  { value: "IN", label: "IN - Indiana" },
  { value: "IA", label: "IA - Iowa" },
  { value: "KS", label: "KS - Kansas" },
  { value: "KY", label: "KY - Kentucky" },
  { value: "LA", label: "LA - Louisiana" },
  { value: "ME", label: "ME - Maine" },
  { value: "MD", label: "MD - Maryland" },
  { value: "MA", label: "MA - Massachusetts" },
  { value: "MI", label: "MI - Michigan" },
  { value: "MN", label: "MN - Minnesota" },
  { value: "MS", label: "MS - Mississippi" },
  { value: "MO", label: "MO - Missouri" },
  { value: "MT", label: "MT - Montana" },
  { value: "NE", label: "NE - Nebraska" },
  { value: "NV", label: "NV - Nevada" },
  { value: "NH", label: "NH - New Hampshire" },
  { value: "NJ", label: "NJ - New Jersey" },
  { value: "NM", label: "NM - New Mexico" },
  { value: "NY", label: "NY - New York" },
  { value: "NC", label: "NC - North Carolina" },
  { value: "ND", label: "ND - North Dakota" },
  { value: "MP", label: "MP - Northern Mariana Islands" },
  { value: "OH", label: "OH - Ohio" },
  { value: "OK", label: "OK - Oklahoma" },
  { value: "OR", label: "OR - Oregon" },
  { value: "PA", label: "PA - Pennsylvania" },
  { value: "PR", label: "PR - Puerto Rico" },
  { value: "RI", label: "RI - Rhode Island" },
  { value: "SC", label: "SC - South Carolina" },
  { value: "SD", label: "SD - South Dakota" },
  { value: "TN", label: "TN - Tennessee" },
  { value: "TX", label: "TX - Texas" },
  { value: "UM", label: "UM - United States Minor Outlying Islands" },
  { value: "UT", label: "UT - Utah" },
  { value: "VT", label: "VT - Vermont" },
  { value: "VI", label: "VI - Virgin Islands" },
  { value: "VA", label: "VA - Virginia" },
  { value: "WA", label: "WA - Washington" },
  { value: "WV", label: "WV - West Virginia" },
  { value: "WI", label: "WI - Wisconsin" },
  { value: "WY", label: "WY - Wyoming" },
  { value: "AA", label: "AA - Armed Forces Americas" },
  { value: "AE", label: "AE - Armed Forces Africa" },
  { value: "AE", label: "AE - Armed Forces Canada" },
  { value: "AE", label: "AE - Armed Forces Europe" },
  { value: "AE", label: "AE - Armed Forces Middle East" },
  { value: "AP", label: "AP - Armed Forces Pacific" },
];

/* Mode that pages can be in; determines what is displayed to the user */
export type Mode = "search" | "results" | "select-query" | "patient-results";

/* Mode that query building pages can be in; determines what is displayed to the user */
export type BuildStep = "selection" | "condition" | "valueset";

export const metadata = {
  title: "Query Connector",
  description: "Try out TEFCA with queries for public health use cases.",
};

/*
 * The expected type of a ValueSet concept.
 */
export interface Concept {
  code: string;
  display: string;
  include: boolean;
}

/*
 * The expected type of a DIBBS ValueSet.
 */
export interface DibbsValueSet {
  valueSetId: string;
  valueSetVersion: string;
  valueSetName: string;
  valueSetExternalId?: string;
  author: string;
  system: string;
  ersdConceptType?: string;
  dibbsConceptType: DibbsConceptType;
  includeValueSet: boolean;
  concepts: Concept[];
  conditionId?: string;
}

export const DEFAULT_ERSD_VERSION = "3";

export type DibbsConceptType = "labs" | "conditions" | "medications";
export type ErsdConceptType =
  | "ostc"
  | "lotc"
  | "lrtc"
  | "mrtc"
  | "dxtc"
  | "sdtc";

export const ersdToDibbsConceptMap: {
  [k in ErsdConceptType]: DibbsConceptType;
} = {
  ostc: "labs",
  lotc: "labs",
  lrtc: "labs",
  mrtc: "medications",
  dxtc: "conditions",
  sdtc: "conditions",
};

// Define the type guard for FHIR resources
// Define the FHIR Resource types
export type FhirResource =
  | Patient
  | Observation
  | DiagnosticReport
  | Condition
  | Encounter
  | Medication
  | MedicationAdministration
  | MedicationRequest;

/**
 * A type guard function that checks if the given resource is a valid FHIR resource.
 * This ensures the resource has a `resourceType` field and is one of the allowed
 * resource types (Patient, Observation, DiagnosticReport, Condition, etc.).
 * @param resource - The resource to check.
 * @returns True if the resource is a valid FHIR resource, false otherwise.
 */
// Define a type guard to check if the object is a FHIR resource
export function isFhirResource(resource: unknown): resource is FhirResource {
  return (
    resource !== null &&
    typeof resource === "object" &&
    resource !== undefined &&
    "resourceType" in resource
  );
}

// The value for "concept version" (sometimes) exists under "expansion" in the VSAC FHIR
// response. This is similar, but different in some subtle ways from the "compose.include"
// path that we're currently using to grab concept information. Although we could
// grab and parse this information from the FHIR response, it would involve
// changing our data model to store information that we think is a "nice to
// have", which is only available sometimes. As a result, we're purposefully
// leaving this blank until we can clean up the migration schema to drop these columns
export const INTENTIONAL_EMPTY_STRING_FOR_CONCEPT_VERSION = "";

// Originally, the column in the concept table was set up to maintain backwards e
//compatibility with the ICD-9 codes that the team is deciding not to support after
// we clean up the DB migration. Leaving these in until we can clean these up
// in the migration schema
export const INTENTIONAL_EMPTY_STRING_FOR_GEM_CODE = "";

// Define the type for the FHIR server configurations
export type FhirServerConfig = {
  id: string;
  name: string;
  hostname: string;
  last_connection_attempt: Date;
  last_connection_successful: boolean;
  headers: Record<string, string>;
};

export const INVALID_USE_CASE = `Invalid use_case. Please provide a valid use_case. Valid use_cases include ${Object.keys(
  USE_CASE_DETAILS
)}.`;
export const INVALID_FHIR_SERVERS = `Invalid fhir_server. Please provide a valid fhir_server.`;
export const RESPONSE_BODY_IS_NOT_PATIENT_RESOURCE =
  "Request body is not a Patient resource.";
export const MISSING_API_QUERY_PARAM = "Missing use_case or fhir_server.";
export const MISSING_PATIENT_IDENTIFIERS =
  "No patient identifiers to parse from requestBody.";
