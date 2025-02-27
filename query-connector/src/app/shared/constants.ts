import { FhirResource } from "fhir/r4";

export const USE_CASE_DETAILS = {
  "newborn-screening": {
    queryName: "Newborn screening follow-up",
    condition: "Newborn Screening",
    // These are the ID's defined in the vs_dump.sql file
    id: "c025a247-0129-4f0c-a2c6-7f3af08e06b4",
  },
  syphilis: {
    queryName: "Syphilis case investigation",
    condition: "Congenital syphilis (disorder)",
    id: "facfefc1-dd39-4f84-9d91-e924e860ad1c",
  },
  gonorrhea: {
    queryName: "Gonorrhea case investigation",
    condition: "Gonorrhea (disorder)",
    id: "73e1a777-49cb-4e19-bc71-8c3fd3ffda64",
  },
  chlamydia: {
    queryName: "Chlamydia case investigation",
    condition: "Chlamydia trachomatis infection (disorder)",
    id: "6edd14a2-ef78-4d8e-8509-0f87a7228d67",
  },
  cancer: {
    queryName: "Cancer case investigation",
    condition: "Cancer (Leukemia)",
    id: "cf580d8d-cc7b-4eae-8a0d-96c36f9222e3",
  },
  immunization: {
    queryName: "Immunization query",
    condition: "",
    id: "e858cba3-59f6-4bc8-9a1e-28fac21c5813",
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
};

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

/* Mode that query pages can be in; determines what is displayed to the user */
export type Mode = "search" | "results" | "select-query" | "patient-results";

/* Mode that query building pages can be in; determines what is displayed to the user */
export type BuildStep = "selection" | "condition" | "valueset";

/* Mode that all pages can be in; used to set page data in context */
export type PageType =
  | "/"
  | "queryBuilding"
  | "fhir-servers"
  | "userManagement"
  | BuildStep
  | Mode;

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

export const INVALID_QUERY = `Query identified in the id param not found in the set of saved queries. Please provide an ID that exists in the saved set of queries.`;
export const INVALID_FHIR_SERVERS = `Invalid fhir_server. Please provide a valid fhir_server.`;
export const RESPONSE_BODY_IS_NOT_PATIENT_RESOURCE =
  "Request body is not a Patient resource.";
export const MISSING_API_QUERY_PARAM = "Missing id or fhir_server.";
export const INVALID_MESSAGE_FORMAT =
  "Invalid message format. Format parameter needs to be either 'HL7' or 'FHIR'";
export const HL7_BODY_MISFORMAT =
  "Invalid HL7 request. Please add your HL7 message to the request body in between curly braces like so - { YOUR MESSAGE HERE } ";
export const MISSING_PATIENT_IDENTIFIERS =
  "No patient identifiers to parse from requestBody.";

// Type definition for CustomUserQueries
export interface CustomUserQuery {
  query_id: string;
  query_name: string;
  conditions_list?: string[];
  valuesets: DibbsValueSet[];
}
