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
/**
 * The use cases that can be used in the app
 */
export const UseCases = [
  "social-determinants",
  "newborn-screening",
  "syphilis",
  "gonorrhea",
  "chlamydia",
  "cancer",
] as const;
export type USE_CASES = (typeof UseCases)[number];

export const UseCaseToQueryName: {
  [key in USE_CASES]: string;
} = {
  "social-determinants": "Social Determinants of Health",
  "newborn-screening": "Newborn Screening",
  syphilis: "Congenital syphilis (disorder)",
  gonorrhea: "Gonorrhea (disorder)",
  chlamydia: "Chlamydia trachomatis infection (disorder)",
  cancer: "Cancer (Leukemia)",
};

/**
 * Labels and values for the query options dropdown on the query page
 */
export const demoQueryOptions = [
  { value: "cancer", label: "Cancer case investigation" },
  { value: "chlamydia", label: "Chlamydia case investigation" },
  { value: "gonorrhea", label: "Gonorrhea case investigation" },
  { value: "newborn-screening", label: "Newborn screening follow-up" },
  {
    value: "social-determinants",
    label: "Gather social determinants of health",
  },
  { value: "syphilis", label: "Syphilis case investigation" },
];

type DemoQueryOptionValue = (typeof demoQueryLabels)[number];
export const demoQueryValToLabelMap = demoQueryOptions.reduce(
  (acc, curVal) => {
    acc[curVal.value as DemoQueryOptionValue] = curVal.label;
    return acc;
  },
  {} as Record<DemoQueryOptionValue, string>,
);
/*
 * Map between the queryType property used to define a demo use case's options,
 * and the name of that query for purposes of searching the DB.
 */
const demoQueryLabels = demoQueryOptions.map((dqo) => dqo.label);
export const QueryTypeToQueryName: {
  [key in (typeof demoQueryLabels)[number]]: string;
} = {
  "Gather social determinants of health": "Social Determinants of Health",
  "Newborn screening follow-up": "Newborn Screening",
  "Syphilis case investigation": "Congenital syphilis (disorder)",
  "Gonorrhea case investigation": "Gonorrhea (disorder)",
  "Chlamydia case investigation": "Chlamydia trachomatis infection (disorder)",
  "Cancer case investigation": "Cancer (Leukemia)",
};

/**
 * The FHIR servers that can be used in the app
 */
export const FhirServers = [
  "HELIOS Meld: Direct",
  "HELIOS Meld: eHealthExchange",
  "JMC Meld: Direct",
  "JMC Meld: eHealthExchange",
  "Public HAPI: Direct",
  "OpenEpic: eHealthExchange",
  "CernerHelios: eHealthExchange",
  "OPHDST Meld: Direct",
] as const;
export type FHIR_SERVERS = (typeof FhirServers)[number];

//Create type to specify the demographic data fields for a patient
export type DemoDataFields = {
  FirstName: string;
  LastName: string;
  DOB: string;
  MRN: string;
  Phone: string;
  FhirServer: FHIR_SERVERS;
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
  | "social-determinants"
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
  "social-determinants": {
    ...hyperUnluckyPatient,
    UseCase: "social-determinants",
  },
  "sti-syphilis-positive": { ...hyperUnluckyPatient, UseCase: "syphilis" },

  // Newborn screening data remains unchanged
  // We need to figure how to display specific cases for specific referral, fail, pass
  // "newborn-screening-technical-fail": {
  //   ...hyperUnluckyPatient,
  // UseCase: "newborn-screening",
  // },
  // "newborn-screening-referral": {
  //   ...hyperUnluckyPatient,
  //   UseCase: "newborn-screening",
  // },
  // "newborn-screening-pass": {
  //   ...hyperUnluckyPatient,
  //   UseCase: "newborn-screening",
  // },
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
  "social-determinants": [
    {
      value: "social-determinants",
      label: "A patient with housing insecurity",
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
 * The expected type of a ValueSet.
 */
export interface ValueSet {
  valueSetId: string;
  valueSetVersion: string;
  valueSetName: string;
  author: string;
  system: string;
  ersdConceptType?: string;
  dibbsConceptType: string;
  includeValueSet: boolean;
  concepts: Concept[];
}

export const DEFAULT_ERSD_VERSION = "3";

type DibbsConceptType = "labs" | "medications" | "conditions";
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

/*
 * The expected type of ValueSets grouped by dibbsConceptType for the purpose of display.
 */
export interface ValueSetDisplay {
  labs: ValueSet[];
  medications: ValueSet[];
  conditions: ValueSet[];
}
export type DibbsValueSetType = keyof ValueSetDisplay;

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
