import categoryToConditionArrayMap from "../assets/aphlCategoryMapping.json";
import queryTableDefaults from "../../assets/dibbs_db_seed_query.json";
import {
  CategoryToConditionArrayMap,
  QueryTableResult,
} from "@/app/(pages)/queryBuilding/utils";
import { translateSnakeStringToCamelCase } from "@/app/backend/db/util";

export const CATEGORY_TO_CONDITION_ARRAY_MAP =
  categoryToConditionArrayMap as unknown as CategoryToConditionArrayMap;

export const CHLAMYDIA_DB_VALUES = queryTableDefaults.query.find((v) =>
  v.queryName.includes("Chlamydia case investigation"),
) as unknown as Record<string, string>;

const emptyChlamydiaDict: { [k: string]: string } = {};

Object.entries(CHLAMYDIA_DB_VALUES).forEach(([k, v]) => {
  emptyChlamydiaDict[translateSnakeStringToCamelCase(k)] = v;
});

export const DEFAULT_CHLAMYDIA_QUERY =
  emptyChlamydiaDict as unknown as QueryTableResult;

const CHLAMYDIA_CONDITION_ID = 240589008;
export const EXPECTED_CHLAMYDIA_VALUESET_LENGTH = Object.values(
  DEFAULT_CHLAMYDIA_QUERY.queryData[CHLAMYDIA_CONDITION_ID],
).length;

export const CANCER_DB_QUERY_VALUES = [
  {
    display: "RESULTS",
    codeSystem: "http://cap.org/eCC",
    code: "9484.100004300",
    valueSetName: "Cancer (Leukemia) Lab Result",
    valueSetId: "14_20240923",
    valueSetExternalId: "14",
    version: "20240923",
    author: "DIBBs",
    type: "lrtc",
    dibbsConceptType: "labs",
    conditionId: "2",
  },
  {
    display:
      "Presence of DNA mismatch repair protein MSH2 in primary malignant neoplasm of colon by immunohistochemistry (observable entity)",
    codeSystem: "http://snomed.info/sct",
    code: "1255068005",
    valueSetName: "Cancer (Leukemia) Lab Result",
    valueSetId: "14_20240923",
    valueSetExternalId: "14",
    version: "20240923",
    author: "DIBBs",
    type: "lrtc",
    dibbsConceptType: "labs",
    conditionId: "2",
  },
  {
    display: "MSH2 Result",
    codeSystem: "http://cap.org/eCC",
    code: "30000.100004300",
    valueSetName: "Cancer (Leukemia) Lab Result",
    valueSetId: "14_20240923",
    valueSetExternalId: "14",
    version: "20240923",
    author: "DIBBs",
    type: "lrtc",
    dibbsConceptType: "labs",
    conditionId: "2",
  },
  {
    display: "Malignant neoplastic disease (disorder)",
    codeSystem: "http://snomed.info/sct",
    code: "363346000",
    valueSetName: "Suspected Cancer (Leukemia) Diagnosis",
    valueSetId: "15_20240923",
    valueSetExternalId: "15",
    version: "20240923",
    author: "DIBBs",
    type: "sdtc",
    dibbsConceptType: "conditions",
    conditionId: "2",
  },
  {
    display: "1 ML alemtuzumab 30 MG/ML Injection",
    codeSystem: "http://www.nlm.nih.gov/research/umls/rxnorm",
    code: "828265",
    valueSetName: "Cancer (Leukemia) Medication",
    valueSetId: "3_20240909",
    valueSetExternalId: "3",
    version: "20240909",
    author: "DIBBs",
    type: "mrtc",
    dibbsConceptType: "medications",
    conditionId: "2",
  },
  {
    display: "Stage II (localized)",
    codeSystem: "http://snomed.info/sct",
    code: "36929009",
    valueSetName: "Cancer (Leukemia) Diagnosis Problem",
    valueSetId: "2_20240909",
    valueSetExternalId: "2",
    version: "20240909",
    author: "DIBBs",
    type: "dxtc",
    dibbsConceptType: "conditions",
    conditionId: "2",
  },
  {
    display: "Stage group.clinical Cancer",
    codeSystem: "http://loinc.org",
    code: "21908-9",
    valueSetName: "Cancer (Leukemia) Diagnosis Problem",
    valueSetId: "2_20240909",
    valueSetExternalId: "2",
    version: "20240909",
    author: "DIBBs",
    type: "dxtc",
    dibbsConceptType: "conditions",
    conditionId: "2",
  },
  {
    display: "Pathology Synoptic report",
    codeSystem: "http://loinc.org",
    code: "60568-3",
    valueSetName: "Cancer (Leukemia) Diagnosis Problem",
    valueSetId: "2_20240909",
    valueSetExternalId: "2",
    version: "20240909",
    author: "DIBBs",
    type: "dxtc",
    dibbsConceptType: "conditions",
    conditionId: "2",
  },
  {
    display: "Chronic lymphoid leukemia, disease (disorder)",
    codeSystem: "http://snomed.info/sct",
    code: "92814006",
    valueSetName: "Cancer (Leukemia) Diagnosis Problem",
    valueSetId: "2_20240909",
    valueSetExternalId: "2",
    version: "20240909",
    author: "DIBBs",
    type: "dxtc",
    dibbsConceptType: "conditions",
    conditionId: "2",
  },
  {
    display: "Allergy to sulfonamide",
    codeSystem: "http://snomed.info/sct",
    code: "418689008",
    valueSetName: "Cancer (Leukemia) Diagnosis Problem",
    valueSetId: "2_20240909",
    valueSetExternalId: "2",
    version: "20240909",
    author: "DIBBs",
    type: "dxtc",
    dibbsConceptType: "conditions",
    conditionId: "2",
  },
];
