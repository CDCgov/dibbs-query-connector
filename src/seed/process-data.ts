import { Concept } from "@/app/models/entities/concepts";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { ErsdConceptType, ersdToDibbsConceptMap } from "@/constants";
import { BundleEntry, ValueSet as FhirValueSet } from "fhir/r4";
import { ErsdCondition, ErsdPayload } from "./constants";

/**
 * Helper function to clean URL info from code system data
 * @param systemURL - url to clean
 * @returns Code system info without the URL info
 */
export function stripProtocolAndTLDFromSystemUrl(systemURL: string) {
  const match = systemURL.match(/https?:\/\/([^\.]+)/);
  return match ? match[1] : systemURL;
}

/**
 * Returns true if the given eRSD resource id (with or without its
 * `-YYYYMMDD` version suffix) is an OID, which is the only kind of id VSAC
 * can resolve. The eRSD also carries resources VSAC doesn't know about:
 * umbrella groupings we don't map to a concept type (e.g. `eltc-3.2.0`,
 * `artc-3.2.0`) and APHL-authored provisional value sets (e.g.
 * `hantavirus-provisional-codes-PROVISIONAL`). Requesting any of those from
 * VSAC returns a 404, which fails the whole seed.
 * @param id Resource id from an eRSD bundle entry.
 * @returns Whether the id can be looked up in VSAC.
 */
export function isVsacOid(id: string | undefined): boolean {
  if (!id) return false;
  return /^\d+(\.\d+)+$/.test(stripErsdVersionSuffix(id));
}

/**
 * Strips the `-YYYYMMDD` version suffix that eRSD v3 appends to
 * non-umbrella valueset resource ids (e.g. `<oid>-20240619`). VSAC
 * accepts the versioned form, but the static seed and condition-to-
 * valueset linkage key off bare OIDs, so we normalize at ingest. v1/v2
 * ids have no suffix and pass through unchanged.
 * @param id Resource id from an eRSD bundle entry.
 * @returns The id with any trailing 8-digit date suffix removed.
 */
export function stripErsdVersionSuffix(id: string): string {
  return id.replace(/-\d{8}$/, "");
}

/**
 * Returns true if the given resource id is an eRSD umbrella valueset id.
 * eRSD v3 versions umbrella ids as `<prefix>-<version>` (e.g. `dxtc-3.1.2`);
 * v1/v2 used bare prefixes. Accepts both shapes.
 * @param id Resource id from an eRSD bundle entry.
 * @returns Whether the id matches one of the umbrella prefixes.
 */
export function isUmbrellaErsdId(id: string | undefined): boolean {
  if (!id) return false;
  return Object.keys(ersdToDibbsConceptMap).some(
    (prefix) => id === prefix || id.startsWith(prefix + "-"),
  );
}

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

/**
 * Mapping function that takes eRSD input to create an ErsdPayload,
 * indexing values by OID and extracting the nested conditions.
 *
 * These values are used later to fetch the relevant resources from the VSAC API
 * using the indexed OIDs.
 *
 * @param ersdValuesets - raw valuesets from the eRSD.
 * @returns ErsdPayload: A payload object containing
 *  - a unique set of OIDs from all the resources
 *  - conditions extracted from the eRSD
 *  - a mapping between the OIDs <> eRSD resources for future scripting use.
 * */
export function createErsdPayload(ersdValuesets: BundleEntry[] | undefined) {
  const oidToErsdResourceMap = new Map<string, string>();

  Object.keys(ersdToDibbsConceptMap).forEach((k) => {
    const umbrellaValueSet = ersdValuesets?.find((vs) => {
      const id = vs.resource?.id;
      return id === k || id?.startsWith(k + "-");
    });

    // These "bulk" valuesets of service types compose references to all
    // value sets that fall under their purview. eRSD v2 packed all refs into
    // a single `include[0]`; v3 emits one `include` entry per ref, so we
    // walk every entry's `valueSet` array.
    const includes =
      (umbrellaValueSet?.resource as FhirValueSet)?.compose?.include || [];
    for (const inc of includes) {
      for (const vsUrl of inc.valueSet || []) {
        // eRSD v3 includes a `|version` suffix on the canonical URL
        // (e.g. `.../ValueSet/<oid>|20230602`). Strip it so we key on raw OID.
        const noVersion = vsUrl.split("|")[0];
        const vsArray = noVersion.split("/");
        const oid = vsArray[vsArray.length - 1];
        oidToErsdResourceMap.set(oid, k);
      }
    }
  });

  // Condition-valueset linkages are stored in the "usage context" structure of
  // the value codeable concept of each resource's base level
  // We can filter out public health informatics contexts to get only the meaningful
  // conditions
  const nonUmbrellaEntries = ersdValuesets?.filter(
    (vs) => !isUmbrellaErsdId(vs.resource?.id),
  ) as BundleEntry[];
  const nonUmbrellaValueSets: Array<FhirValueSet> = (
    nonUmbrellaEntries || []
  ).map((vs) => {
    return (vs.resource as FhirValueSet) || ({} as FhirValueSet);
  });

  // Only OID-identified value sets exist in VSAC. Anything else left over
  // (umbrella groupings we don't map to a concept type, APHL-authored
  // provisional value sets) would 404 there and fail the whole seed, so we
  // leave it out of both the fetch list and the condition linkages.
  const skippedIds = nonUmbrellaValueSets
    .map((vs) => vs.id)
    .filter((id) => !isVsacOid(id));
  if (skippedIds.length > 0) {
    console.warn(
      `Skipping ${skippedIds.length} eRSD value set(s) that can't be fetched from VSAC: ${skippedIds.join(", ")}`,
    );
  }

  const conditions = nonUmbrellaValueSets
    .filter((vs) => isVsacOid(vs.id))
    .reduce((acc: Array<ErsdCondition>, vs: FhirValueSet) => {
      const conditionSchemes = vs.useContext?.filter(
        (context) =>
          !(context.valueCodeableConcept?.coding || [])[0].system?.includes(
            "us-ph-usage-context",
          ),
      );
      (conditionSchemes || []).forEach((usc) => {
        const ersdCond: ErsdCondition = {
          code: (usc.valueCodeableConcept?.coding || [])[0].code || "",
          system: (usc.valueCodeableConcept?.coding || [])[0].system || "",
          text: usc.valueCodeableConcept?.text || "",
          valueset_id: stripErsdVersionSuffix(vs.id || ""),
        };
        acc.push(ersdCond);
      });
      return acc;
    }, []);

  // Take out the umbrella value sets from the ones we try to insert, then
  // strip the `-YYYYMMDD` version suffix that eRSD v3 appends to non-umbrella
  // ids so we send bare OIDs to VSAC and key the DB on bare OIDs (matches the
  // static seed's `WHERE oid = $1` lookups).
  let oids = ersdValuesets
    ?.map((vs) => vs.resource?.id)
    .filter((oid) => !isUmbrellaErsdId(oid) && isVsacOid(oid))
    .map((oid) => (oid ? stripErsdVersionSuffix(oid) : oid));

  return {
    oids: oids,
    conditions: conditions,
    oidToErsdResourceMap: oidToErsdResourceMap,
  } as ErsdPayload;
}
