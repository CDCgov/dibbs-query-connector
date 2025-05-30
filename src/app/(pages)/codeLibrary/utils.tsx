import {
  DibbsConceptType,
  DibbsValueSet,
} from "@/app/models/entities/valuesets";
import { vsAuthorMap } from "./components/DropdownFilter";

export const emptyValueSet: DibbsValueSet = {
  valueSetId: "",
  valueSetName: "",
  valueSetVersion: "",
  author: "",
  system: "",
  dibbsConceptType: "" as DibbsConceptType,
  includeValueSet: false,
  concepts: [],
  userCreated: true,
};

export const emptyVsAuthorMapItem: vsAuthorMap = { "": [""] };

export const emptyFilterSearch = {
  category: "" as DibbsConceptType,
  codeSystem: "",
  creators: { "": [] },
};

export const CodeSystemOptions = [
  "http://hl7.org/fhir/sid/icd-10-cm",
  "http://hl7.org/fhir/sid/cvx",
  "http://www.nlm.nih.gov/research/umls/rxnorm",
  "http://loinc.org",
  "http://cap.org/eCC",
  "http://snomed.info/sct",
];

export type CustomCodeMode = "manage" | "select" | "create" | "edit";
