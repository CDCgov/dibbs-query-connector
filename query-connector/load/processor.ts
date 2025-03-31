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

export const DEFAULT_DEMO_FHIR_SERVER = "Aidbox";
/*
 * Common "Hyper Unlucky" patient data used for all non-newborn screening use cases
 */
export const hyperUnluckyPatient = {
  FirstName: "Hyper",
  LastName: "Unlucky",
  DOB: "1975-12-06",
  MRN: "8692756",
  Phone: "517-425-1398",
  FhirServer: DEFAULT_DEMO_FHIR_SERVER,
};

const SUPPORTED_QUERIES = Object.values(USE_CASE_DETAILS).filter((v) => {
  return v.queryName !== "Immunization query";
});

/**
 * Helper function for the load test process
 * @returns A random query from the out-of-box options for
 * the db load tests
 */
export function chooseDefaultQueryToRun() {
  const index = Math.floor(Math.random() * SUPPORTED_QUERIES.length);
  const query = SUPPORTED_QUERIES[index];
  return {
    fhir_server: hyperUnluckyPatient.FhirServer,
    id: query.id,
    given: hyperUnluckyPatient.FirstName,
    family: hyperUnluckyPatient.LastName,
    dob: hyperUnluckyPatient.DOB,
    mrn: hyperUnluckyPatient.MRN,
    phone: hyperUnluckyPatient.Phone,
  };
}

/**
 * Helper function for load tests
 * @param userContext - information about the synthetic user event being run
 * @param events - info about the user events
 * @param done - a callback function to call to trigger the next value
 * @returns - Status to trigger the following step of the load test process
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setup(userContext: any, events: any, done: () => void) {
  const vars = chooseDefaultQueryToRun();
  userContext.vars = { ...vars };
  return done();
}
