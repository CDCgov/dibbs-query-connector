"use server";
import { Pool, PoolConfig, QueryResultRow } from "pg";
import { Bundle, OperationOutcome, ValueSet as FhirValueSet } from "fhir/r4";
import {
  Concept,
  ErsdConceptType,
  ValueSet,
  ersdToDibbsConceptMap,
} from "./constants";
import { encode } from "base-64";
import { randomUUID } from "crypto";

const getQuerybyNameSQL = `
select q.query_name, q.id, qtv.valueset_id, vs.name as valueset_name, vs.version, vs.author as author, vs.type, vs.dibbs_concept_type as dibbs_concept_type, qic.concept_id, qic.include, c.code, c.code_system, c.display 
  from query q 
  left join query_to_valueset qtv on q.id = qtv.query_id 
  left join valuesets vs on qtv.valueset_id = vs.id
  left join query_included_concepts qic on qtv.id = qic.query_by_valueset_id 
  left join concepts c on qic.concept_id = c.id 
  where q.query_name = $1;
`;

// Load environment variables from .env and establish a Pool configuration
const dbConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum # of connections in the pool
  idleTimeoutMillis: 30000, // A client must sit idle this long before being released
  connectionTimeoutMillis: 2000, // Wait this long before timing out when connecting new client
};
const dbClient = new Pool(dbConfig);

/**
 * Executes a search for a CustomQuery against the query-loaded Postgres
 * Database, using the saved name associated with the query as the unique
 * identifier by which to load the result.
 * @param name The name given to a stored query in the DB.
 * @returns One or more rows from the DB matching the requested saved query,
 * or an error if no results can be found.
 */
export const getSavedQueryByName = async (name: string) => {
  const values = [name];

  try {
    const result = await dbClient.query(getQuerybyNameSQL, values);
    if (result.rows.length === 0) {
      console.error("No results found for query:", name);
      return [];
    }
    return result.rows;
  } catch (error) {
    console.error("Error retrieving query:", error);
    throw error;
  }
};

/**
 * Maps the results returned from the DIBBs value set and coding system database
 * into a collection of value sets, each containing one or more Concepts build out
 * of the coding information in the DB.
 * @param rows The Rows returned from the DB Query.
 * @returns A list of ValueSets, which hold the Concepts pulled from the DB.
 */
export const mapQueryRowsToConceptValueSets = async (
  rows: QueryResultRow[],
) => {
  // Create groupings of rows (each of which is a single Concept) by their ValueSet ID
  const vsIdGroupedRows = rows.reduce((conceptsByVSId, r) => {
    if (!(r["valueset_id"] in conceptsByVSId)) {
      conceptsByVSId[r["valueset_id"]] = [];
    }
    conceptsByVSId[r["valueset_id"]].push(r);
    return conceptsByVSId;
  }, {});

  // Each "prop" of the struct is now a ValueSet ID
  // Iterate over them to create formal Concept Groups attached to a formal VS
  const valueSets = Object.keys(vsIdGroupedRows).map((vsID) => {
    const conceptGroup: QueryResultRow[] = vsIdGroupedRows[vsID];
    const valueSet: ValueSet = {
      valueSetId: conceptGroup[0]["valueset_id"],
      valueSetVersion: conceptGroup[0]["version"],
      valueSetName: conceptGroup[0]["valueset_name"],
      author: conceptGroup[0]["author"],
      system: conceptGroup[0]["code_system"],
      ersdConceptType: conceptGroup[0]["type"],
      dibbsConceptType: conceptGroup[0]["dibbs_concept_type"],
      includeValueSet: conceptGroup.find((c) => c["include"]) ? true : false,
      concepts: conceptGroup.map((c) => {
        return {
          code: c["code"],
          display: c["display"],
          include: c["include"],
        };
      }),
    };
    return valueSet;
  });
  return valueSets;
};

/*
 * The expected return type from both the eRSD API and the VSAC FHIR API.
 */
type ErsdOrVsacResponse = Bundle | OperationOutcome;

/**
 * Fetches the eRSD Specification from the eRSD API. This function requires an API key
 * to access the eRSD API. The API key can be obtained at https://ersd.aimsplatform.org/#/api-keys.
 * @param eRSDVersion - The version of the eRSD specification to retrieve. Defaults to v2.
 * @returns The eRSD Specification as a FHIR Bundle or an OperationOutcome if an error occurs.
 */
export async function getERSD(
  eRSDVersion: number = 3,
): Promise<ErsdOrVsacResponse> {
  const ERSD_API_KEY = process.env.ERSD_API_KEY;
  const eRSDUrl = `https://ersd.aimsplatform.org/api/ersd/v${eRSDVersion}specification?format=json&api-key=${ERSD_API_KEY}`;
  const response = await fetch(eRSDUrl);
  if (response.status === 200) {
    const data = (await response.json()) as Bundle;
    return data;
  } else {
    return {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "processing",
          diagnostics: `Failed to retrieve data from eRSD: ${response.status} ${response.statusText}`,
        },
      ],
    } as OperationOutcome;
  }
}

/**
 * Fetches the VSAC Value Sets and supporting code systems information for a given OID
 * as a FHIR bundle. This function requires a UMLS API Key which must be obtained as a
 * Metathesaurus License. See https://www.nlm.nih.gov/vsac/support/usingvsac/vsacfhirapi.html
 * for authentication instructions.
 * @param oid The OID whose value sets to retrieve.
 * @returns The value sets as a FHIR bundle, or an Operation Outcome if there is an error.
 */
export async function getVSACValueSet(
  oid: string,
): Promise<ErsdOrVsacResponse> {
  const username: string = "apikey";
  const umlsKey: string = process.env.UMLS_API_KEY || "";
  const vsacUrl: string = `https://cts.nlm.nih.gov/fhir/ValueSet/${oid}`;
  const response = await fetch(vsacUrl, {
    method: "get",
    headers: new Headers({
      Authorization: "Basic " + encode(username + ":" + umlsKey),
      "Content-Type": "application/fhir+json",
    }),
  });
  if (response.status === 200) {
    const data = (await response.json()) as Bundle;
    return data;
  } else {
    const diagnosticIssue = await response
      .json()
      .then((r) => r.issue[0].diagnostics);
    return {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "processing",
          diagnostics: `${response.status}: ${diagnosticIssue}`,
        },
      ],
    } as OperationOutcome;
  }
}

/**
 * Translates a VSAC FHIR bundle to our internal ValueSet struct
 * @param fhirValueset - The FHIR ValueSet response from VSAC
 * @param ersdConceptType - The associated clinical concept type from ERSD
 * @returns An object of type InternalValueSet
 */
export async function translateVSACToInternalValueSet(
  fhirValueset: FhirValueSet,
  ersdConceptType: ErsdConceptType,
) {
  const id = fhirValueset.id;
  const version = fhirValueset.version;

  const name = fhirValueset.title;
  const author = fhirValueset.publisher;

  const bundleConceptData = fhirValueset?.compose?.include[0];
  const system = bundleConceptData?.system;
  const concepts = bundleConceptData?.concept?.map((fhirConcept) => {
    return { ...fhirConcept, include: false } as Concept;
  });

  return {
    valueSetId: id,
    valueSetVersion: version,
    valueSetName: name,
    author: author,
    system: system,
    ersdConceptType: ersdConceptType,
    dibbsConceptType: ersdToDibbsConceptMap[ersdConceptType],
    includeValueSet: false,
    concepts: concepts,
  } as ValueSet;
}

/**
 * Function call to insert a new ValueSet into the database.
 * @param vs - a ValueSet in of the shape of our internal data model to insert
 * @returns success / failure information, as well as errors as appropriate
 */
export async function insertValueSet(vs: ValueSet) {
  const insertValueSetSql = generateValueSetSqlStatement(vs);
  try {
    await dbClient.query(insertValueSetSql);
  } catch (e) {
    // handle error somehow
    console.error(e);
    return { success: false, error: e };
  }

  const insertConceptsSqlArray = generateConceptSqlStatements(vs);
  const results = await Promise.allSettled(insertConceptsSqlArray);
  const allSucceeded = results.every((r) => r.status === "fulfilled");
  if (allSucceeded) return { success: true };

  const failedInserts = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => r.reason);

  return { success: false, error: failedInserts };
}

/**
 * Helper function to generate the SQL needed for valueset insertion.
 * @param vs - The ValueSet in of the shape of our internal data model to insert
 * @returns The SQL statement for insertion
 */
function generateValueSetSqlStatement(vs: ValueSet) {
  const valueSetOid = vs.valueSetId;
  const valueSetUniqueId = `${valueSetOid}_${vs.valueSetVersion}`;
  const insertValueSetSql = `INSERT INTO valuesets VALUES('${valueSetUniqueId}','${valueSetOid}','${vs.valueSetVersion}','${vs.valueSetName}','${vs.author}','${vs.ersdConceptType}');`;
  return insertValueSetSql;
}

/**
 * Helper function to generate the SQL needed for concept / valueset join insertion
 * needed during valueset creation.
 * @param vs - The ValueSet in of the shape of our internal data model to insert
 * @returns The SQL statement array for all concepts for insertion
 */
function generateConceptSqlStatements(vs: ValueSet) {
  const valueSetOid = vs.valueSetId;
  const valueSetUniqueId = `${valueSetOid}_${vs.valueSetVersion}`;

  const insertConceptsSqlArray = vs.concepts.map((concept) => {
    const conceptUniqueId = `${valueSetOid}_${concept.code}`;
    // what's the value of the gem_formated_code // concept version? Do we prefer
    // nulls?
    const insertConceptSql = `INSERT INTO concepts VALUES('${conceptUniqueId}','${concept.code}','${vs.system}','${concept.display}','${concept.code}','${vs.valueSetVersion}');`;

    const primaryKey = randomUUID();
    const insertJoinSql = `INSERT INTO valueset_to_concept VALUES('${primaryKey}','${valueSetUniqueId}','${conceptUniqueId}');`;

    const sequentialInsertPromise = new Promise(async () => {
      try {
        await dbClient.query(insertConceptSql);
        await dbClient.query(insertJoinSql);
      } catch (e) {
        // what error do we want to output?
        console.error(e);
      }
    });

    return sequentialInsertPromise;
  });

  return insertConceptsSqlArray;
}
