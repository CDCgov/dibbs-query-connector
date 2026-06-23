// Utils file for any code that doesn't need to be async, which is a requirement
// to export out the db-creation server component file

import { Concept } from "@/app/models/entities/concepts";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { ErsdConceptType, ersdToDibbsConceptMap } from "../../constants";
import { BundleEntry, ValueSet as FhirValueSet, ValueSet } from "fhir/r4";
import { insertValuesetToConceptSql, insertConceptSql } from "./seedSqlStructs";
import { DbClient } from "../db/service";

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
 * Mapping function that takes eRSD input and indexes values by OID, as well as
 * parsing out condotion <> valueset linkages from the ingestion input
 * @param valuesets - raw valuesets from the eRSD.
 * @returns oidToErsdType: A map of OID <> eRSD concept types
 * nonUmbrellaEntries: map of valuesets to conditions as dictated by the eRSD
 */
export function indexErsdByOid(valuesets: BundleEntry[] | undefined) {
  const oidToErsdType = new Map<string, string>();
  Object.keys(ersdToDibbsConceptMap).forEach((k) => {
    const umbrellaValueSet = valuesets?.find((vs) => {
      const id = vs.resource?.id;
      return id === k || id?.startsWith(k + "-");
    });

    // These "bulk" valuesets of service types compose references to all
    // value sets that fall under their purview. eRSD v2 packed all refs into
    // a single `include[0]`; v3 emits one `include` entry per ref, so we
    // walk every entry's `valueSet` array.
    const includes =
      (umbrellaValueSet?.resource as ValueSet)?.compose?.include || [];
    for (const inc of includes) {
      for (const vsUrl of inc.valueSet || []) {
        // eRSD v3 includes a `|version` suffix on the canonical URL
        // (e.g. `.../ValueSet/<oid>|20230602`). Strip it so we key on raw OID.
        const noVersion = vsUrl.split("|")[0];
        const vsArray = noVersion.split("/");
        const oid = vsArray[vsArray.length - 1];
        oidToErsdType.set(oid, k);
      }
    }
  });

  // Condition-valueset linkages are stored in the "usage context" structure of
  // the value codeable concept of each resource's base level
  // We can filter out public health informatics contexts to get only the meaningful
  // conditions
  const nonUmbrellaEntries = valuesets?.filter(
    (vs) => !isUmbrellaErsdId(vs.resource?.id),
  ) as BundleEntry[];
  const nonUmbrellaValueSets: Array<ValueSet> = (nonUmbrellaEntries || []).map(
    (vs) => {
      return (vs.resource as ValueSet) || ({} as ValueSet);
    },
  );

  return {
    oidToErsdType: oidToErsdType,
    nonUmbrellaValueSets: nonUmbrellaValueSets,
  };
}

/**
 * Helper function to generate the SQL needed for valueset-to-concept join insertion.
 * @param vs - The ValueSet in of the shape of our internal data model to insert
 * @param dbClient - The client to be used to allow seeding to be transactional. We
 * neeed to manually manage the client connection rather than delegating it to the
 * pool because of the cross-relationships in the seeding data.
 * @returns The SQL statement array for join rows
 */
export function generateValuesetConceptJoinSqlPromises(
  vs: DibbsValueSet,
  dbClient: DbClient,
) {
  return vs.concepts.map((concept) => {
    const systemPrefix = vs.system
      ? stripProtocolAndTLDFromSystemUrl(vs.system)
      : "";
    const conceptUniqueId = `${systemPrefix}_${concept.code}`;

    return dbClient.query(insertValuesetToConceptSql, [
      `${vs.valueSetId}_${conceptUniqueId}`,
      vs.valueSetId,
      conceptUniqueId,
    ]);
  });
}

/**
 * Helper function to generate the SQL needed for concept insertion
 * needed during valueset creation.
 * @param vs - The ValueSet in of the shape of our internal data model to insert
 * @returns The SQL statement array for all concepts for insertion
 * @param dbClient - The client to be used to allow seeding to be transactional. We
 * neeed to manually manage the client connection rather than delegating it to the
 * pool because of the cross-relationships in the seeding data.
 */
export function generateConceptSqlPromises(
  vs: DibbsValueSet,
  dbClient: DbClient,
) {
  return vs.concepts.map((concept) => {
    const systemPrefix = vs.system
      ? stripProtocolAndTLDFromSystemUrl(vs.system)
      : "";
    const conceptUniqueId = `${systemPrefix}_${concept.code}`;

    return dbClient.query(insertConceptSql, [
      conceptUniqueId,
      concept.code,
      vs.system,
      concept.display,
    ]);
  });
}

/**
 * Helper function to clean URL info from code system data
 * @param systemURL - url to clean
 * @returns Code system info without the URL info
 */
export function stripProtocolAndTLDFromSystemUrl(systemURL: string) {
  const match = systemURL.match(/https?:\/\/([^\.]+)/);
  return match ? match[1] : systemURL;
}
