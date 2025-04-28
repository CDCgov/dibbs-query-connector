import categoryToConditionArrayMap from "../assets/aphlCategoryMapping.json";
import queryTableDefaults from "../../assets/dibbs_db_seed_query.json";
import {
  CategoryToConditionArrayMap,
  QueryTableResult,
} from "@/app/(pages)/queryBuilding/utils";
import { translateSnakeStringToCamelCase } from "@/app/backend/dbServices/decorators";

export const CATEGORY_TO_CONDITION_ARRAY_MAP =
  categoryToConditionArrayMap as unknown as CategoryToConditionArrayMap;

export const CHLAMYDIA_DB_VALUES = queryTableDefaults.query.find((v) =>
  v.query_name.includes("Chlamydia case investigation"),
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
    code_system: "http://cap.org/eCC",
    code: "9484.100004300",
    valueset_name: "Cancer (Leukemia) Lab Result",
    valueset_id: "14_20240923",
    valueset_external_id: "14",
    version: "20240923",
    author: "DIBBs",
    type: "lrtc",
    dibbs_concept_type: "labs",
    condition_id: "2",
  },
  {
    display:
      "Presence of DNA mismatch repair protein MSH2 in primary malignant neoplasm of colon by immunohistochemistry (observable entity)",
    code_system: "http://snomed.info/sct",
    code: "1255068005",
    valueset_name: "Cancer (Leukemia) Lab Result",
    valueset_id: "14_20240923",
    valueset_external_id: "14",
    version: "20240923",
    author: "DIBBs",
    type: "lrtc",
    dibbs_concept_type: "labs",
    condition_id: "2",
  },
  {
    display: "MSH2 Result",
    code_system: "http://cap.org/eCC",
    code: "30000.100004300",
    valueset_name: "Cancer (Leukemia) Lab Result",
    valueset_id: "14_20240923",
    valueset_external_id: "14",
    version: "20240923",
    author: "DIBBs",
    type: "lrtc",
    dibbs_concept_type: "labs",
    condition_id: "2",
  },
  {
    display: "Malignant neoplastic disease (disorder)",
    code_system: "http://snomed.info/sct",
    code: "363346000",
    valueset_name: "Suspected Cancer (Leukemia) Diagnosis",
    valueset_id: "15_20240923",
    valueset_external_id: "15",
    version: "20240923",
    author: "DIBBs",
    type: "sdtc",
    dibbs_concept_type: "conditions",
    condition_id: "2",
  },
  {
    display: "1 ML alemtuzumab 30 MG/ML Injection",
    code_system: "http://www.nlm.nih.gov/research/umls/rxnorm",
    code: "828265",
    valueset_name: "Cancer (Leukemia) Medication",
    valueset_id: "3_20240909",
    valueset_external_id: "3",
    version: "20240909",
    author: "DIBBs",
    type: "mrtc",
    dibbs_concept_type: "medications",
    condition_id: "2",
  },
  {
    display: "Stage II (localized)",
    code_system: "http://snomed.info/sct",
    code: "36929009",
    valueset_name: "Cancer (Leukemia) Diagnosis Problem",
    valueset_id: "2_20240909",
    valueset_external_id: "2",
    version: "20240909",
    author: "DIBBs",
    type: "dxtc",
    dibbs_concept_type: "conditions",
    condition_id: "2",
  },
  {
    display: "Stage group.clinical Cancer",
    code_system: "http://loinc.org",
    code: "21908-9",
    valueset_name: "Cancer (Leukemia) Diagnosis Problem",
    valueset_id: "2_20240909",
    valueset_external_id: "2",
    version: "20240909",
    author: "DIBBs",
    type: "dxtc",
    dibbs_concept_type: "conditions",
    condition_id: "2",
  },
  {
    display: "Pathology Synoptic report",
    code_system: "http://loinc.org",
    code: "60568-3",
    valueset_name: "Cancer (Leukemia) Diagnosis Problem",
    valueset_id: "2_20240909",
    valueset_external_id: "2",
    version: "20240909",
    author: "DIBBs",
    type: "dxtc",
    dibbs_concept_type: "conditions",
    condition_id: "2",
  },
  {
    display: "Chronic lymphoid leukemia, disease (disorder)",
    code_system: "http://snomed.info/sct",
    code: "92814006",
    valueset_name: "Cancer (Leukemia) Diagnosis Problem",
    valueset_id: "2_20240909",
    valueset_external_id: "2",
    version: "20240909",
    author: "DIBBs",
    type: "dxtc",
    dibbs_concept_type: "conditions",
    condition_id: "2",
  },
  {
    display: "Allergy to sulfonamide",
    code_system: "http://snomed.info/sct",
    code: "418689008",
    valueset_name: "Cancer (Leukemia) Diagnosis Problem",
    valueset_id: "2_20240909",
    valueset_external_id: "2",
    version: "20240909",
    author: "DIBBs",
    type: "dxtc",
    dibbs_concept_type: "conditions",
    condition_id: "2",
  },
];
