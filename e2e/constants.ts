import { hyperUnluckyPatient } from "@/app/shared/constants";

export const TEST_PATIENT = hyperUnluckyPatient;
export const TEST_PATIENT_NAME =
  hyperUnluckyPatient.FirstName + " A. " + hyperUnluckyPatient.LastName;
export const showSiteAlert = process.env.DEMO_MODE;
export const DEFAULT_FHIR_SERVER = "Aidbox";

export const CANCER_FRONTEND_NESTED_INPUT = {
  "2": {
    labs: {
      "14_20240923": {
        valueSetId: "14_20240923",
        valueSetVersion: "20240923",
        valueSetName: "Cancer (Leukemia) Lab Result",
        valueSetExternalId: "14",
        author: "DIBBs",
        system: "http://cap.org/eCC",
        ersdConceptType: "lrtc",
        dibbsConceptType: "labs",
        includeValueSet: true,
        userCreated: false,
        concepts: [
          {
            code: "9484.100004300",
            display: "RESULTS",
            include: true,
          },
          {
            code: "1255068005",
            display:
              "Presence of DNA mismatch repair protein MSH2 in primary malignant neoplasm of colon by immunohistochemistry (observable entity)",
            include: true,
          },
          {
            code: "30000.100004300",
            display: "MSH2 Result",
            include: true,
          },
        ],
        conditionId: "2",
      },
    },
    conditions: {
      "15_20240923": {
        valueSetId: "15_20240923",
        valueSetVersion: "20240923",
        valueSetName: "Suspected Cancer (Leukemia) Diagnosis",
        valueSetExternalId: "15",
        author: "DIBBs",
        system: "http://snomed.info/sct",
        ersdConceptType: "sdtc",
        dibbsConceptType: "conditions",
        userCreated: false,
        includeValueSet: true,
        concepts: [
          {
            code: "363346000",
            display: "Malignant neoplastic disease (disorder)",
            include: true,
          },
        ],
        conditionId: "2",
      },
      "2_20240909": {
        valueSetId: "2_20240909",
        valueSetVersion: "20240909",
        valueSetName: "Cancer (Leukemia) Diagnosis Problem",
        valueSetExternalId: "2",
        author: "DIBBs",
        system: "http://snomed.info/sct",
        ersdConceptType: "dxtc",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        userCreated: false,
        concepts: [
          {
            code: "36929009",
            display: "Stage II (localized)",
            include: true,
          },
          {
            code: "21908-9",
            display: "Stage group.clinical Cancer",
            include: true,
          },
          {
            code: "60568-3",
            display: "Pathology Synoptic report",
            include: true,
          },
          {
            code: "92814006",
            display: "Chronic lymphoid leukemia, disease (disorder)",
            include: true,
          },
          {
            code: "418689008",
            display: "Allergy to sulfonamide",
            include: true,
          },
        ],
        conditionId: "2",
      },
    },
    medications: {
      "3_20240909": {
        valueSetId: "3_20240909",
        valueSetVersion: "20240909",
        valueSetName: "Cancer (Leukemia) Medication",
        valueSetExternalId: "3",
        author: "DIBBs",
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        ersdConceptType: "mrtc",
        dibbsConceptType: "medications",
        includeValueSet: true,
        userCreated: false,
        concepts: [
          {
            code: "828265",
            display: "1 ML alemtuzumab 30 MG/ML Injection",
            include: true,
          },
        ],
        conditionId: "2",
      },
    },
  },
};

// note: values here are also hard-coded in the seed script at seed_aidbox.sh,
// so change them there as well if you change it here
export const E2E_SMART_TEST_CLIENT_ID = "e2e-smart-test-client";
export const E2E_SMART_TEST_CLIENT_SCOPES = "system/*.read";
