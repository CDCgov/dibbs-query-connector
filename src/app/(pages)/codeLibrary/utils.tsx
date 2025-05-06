import {
  DibbsConceptType,
  DibbsValueSet,
} from "@/app/models/entities/valuesets";

/**
 * Helper method to extract the source system display name from the url string.
 * Similar to DBServive.stripProtocolAndTLDFromSystemUrl, but builds in specific
 * checks for known string outliers
 * @param system the url string to format
 * @returns the display name of the system, stripped of url prefixes
 */
export const formatSystem = (system: string) => {
  const match = system.match(/https?:\/\/([^\.]+)/);
  let result = match?.[1];

  switch (result) {
    case "hl7":
      const hl7Arr = system.split("/");
      result = hl7Arr[hl7Arr.length - 1];
      if (result == "icd-10-cm") {
        result = result.slice(0, result.indexOf("-cm"));
      }
      return result.toLocaleUpperCase();

    case "www":
    case "cap":
      const rxArr = system.split("/");
      return rxArr[rxArr?.length - 1].toLocaleUpperCase();

    default:
      return result?.toUpperCase();
  }
};

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

export const emptyCodeMapItem = {
  "0": {
    display: "",
    code: "",
    include: false,
  },
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
