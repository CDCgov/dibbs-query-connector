/**
 * @param system string
 * @returns string
 */
export const formatSystem = (system: string) => {
  switch (true) {
    case system.includes("snomed"):
      return "SNOMED";
    case system.includes("rxnorm"):
      return "RXNorm";
    case system.includes("http://hl7.org/fhir/sid/icd-10-cm"):
      return "ICD-10";
    default:
      return "";
  }
};
