// Lib file for any code that doesn't need to be async, which is a requirement
// to export out the db-creation server component file
import { Concept } from "@/app/models/entities/concepts";
import { ErsdConceptType, ersdToDibbsConceptMap } from "../../constants";
import { ValueSet as FhirValueSet } from "fhir/r4";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
/**
 * Translates a VSAC FHIR bundle to our internal ValueSet struct
 * @param fhirValueset - The FHIR ValueSet response from VSAC
 * @param ersdConceptType - The associated clinical concept type from ERSD
 * @returns An object of type InternalValueSet
 */
export function translateVSACToInternalValueSet(
  fhirValueset: FhirValueSet,
  ersdConceptType: ErsdConceptType,
) {
  const oid = fhirValueset.id;
  const version = fhirValueset.version;

  const name = fhirValueset.title;
  const author = fhirValueset.publisher;

  const bundleConceptData = fhirValueset?.compose?.include[0];
  const system = bundleConceptData?.system;
  const concepts = bundleConceptData?.concept?.map((fhirConcept) => {
    return { ...fhirConcept, include: false } as Concept;
  });

  return {
    valueSetId: `${oid}_${version}`,
    valueSetVersion: version,
    valueSetName: name,
    valueSetExternalId: oid,
    author: author,
    system: system,
    ersdConceptType: ersdConceptType,
    dibbsConceptType: ersdToDibbsConceptMap[ersdConceptType],
    includeValueSet: false,
    concepts: concepts,
    userCreated: false,
  } as DibbsValueSet;
}
