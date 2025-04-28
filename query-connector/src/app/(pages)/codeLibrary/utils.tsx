/**
 * @param system string
 * @returns string
 */
export const formatSystem = (system: string) => {
  switch (true) {
    case system.includes("http://snomed.info/sct"):
      return "SNOMED";
    case system.includes("http://www.nlm.nih.gov/research/umls/rxnorm"):
      return "RXNORM";
    case system.includes("http://hl7.org/fhir/sid/icd-10-cm"):
      return "ICD-10";
    case system.includes("http://loinc.org"):
      return "LOINC";
    default:
      return system;
  }
};
