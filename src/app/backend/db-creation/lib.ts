// Lib file for any code that doesn't need to be async, which is a requirement
// to export out the db-creation server component file
import { Concept } from "@/app/models/entities/concepts";
import { ErsdConceptType, ersdToDibbsConceptMap } from "../../constants";
import {
  BundleEntry,
  FhirResource,
  ValueSet as FhirValueSet,
  ValueSet,
} from "fhir/r4";
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

const ERSD_TYPED_RESOURCE_URL = "http://ersd.aimsplatform.org/fhir/ValueSet/";

/**
 * Mapping function that takes eRSD input and indexes values by OID, as well as
 * parsing out condotion <> valueset linkages from the ingestion input
 * @param valuesets - raw valuesets from the eRSD.
 * @returns oidToErsdType: A map of OID <> eRSD concept types
 * nonUmbrellaEntries: map of valuesets to conditions as dictated by the eRSD
 */
export function indexErsdByOid(
  valuesets: BundleEntry<FhirResource>[] | undefined,
) {
  const oidToErsdType = new Map<string, string>();
  Object.keys(ersdToDibbsConceptMap).forEach((k) => {
    const keyedUrl = ERSD_TYPED_RESOURCE_URL + k;
    const umbrellaValueSet = valuesets?.find((vs) => vs.fullUrl === keyedUrl);

    // These "bulk" valuesets of service types compose references
    // to all value sets that fall under their purview
    const composedValueSets: Array<string> =
      (umbrellaValueSet as BundleEntry<ValueSet>)?.resource?.compose?.include[0]
        .valueSet || ([] as Array<string>);
    composedValueSets.reduce((acc: Map<string, string>, vsUrl: string) => {
      const vsArray = vsUrl.split("/");
      const oid = vsArray[vsArray.length - 1];
      acc.set(oid, k);
      return acc;
    }, oidToErsdType);
  });

  // Condition-valueset linkages are stored in the "usage context" structure of
  // the value codeable concept of each resource's base level
  // We can filter out public health informatics contexts to get only the meaningful
  // conditions
  const nonUmbrellaEntries = valuesets?.filter(
    (vs) => !Object.keys(ersdToDibbsConceptMap).includes(vs.resource?.id || ""),
  ) as BundleEntry<ValueSet>[];
  const nonUmbrellaValueSets: Array<ValueSet> = (nonUmbrellaEntries || []).map(
    (vs) => {
      return vs.resource || ({} as ValueSet);
    },
  );

  return {
    oidToErsdType: oidToErsdType,
    nonUmbrellaValueSets: nonUmbrellaValueSets,
  };
}
