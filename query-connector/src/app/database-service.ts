"use server";
import { Pool, PoolConfig, QueryResultRow } from "pg";
import { Bundle, OperationOutcome, ValueSet as FhirValueSet } from "fhir/r4";
import {
  Concept,
  ErsdConceptType,
  INTENTIONAL_EMPTY_STRING_FOR_CONCEPT_VERSION,
  INTENTIONAL_EMPTY_STRING_FOR_GEM_CODE,
  ValueSet,
  ersdToDibbsConceptMap,
} from "./constants";
import { encode } from "base-64";
import {
  UserQueryInput,
  generateUserDefinedQueryInsertionSql,
  generateUserDefinedQueryToValueSetInsertionSql,
} from "./query-building";
import { UUID } from "crypto";

const getQuerybyNameSQL = `
select q.query_name, q.id, qtv.valueset_id, vs.name as valueset_name, vs.oid as valueset_external_id, vs.version, vs.author as author, vs.type, vs.dibbs_concept_type as dibbs_concept_type, qic.concept_id, qic.include, c.code, c.code_system, c.display 
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
export const mapQueryRowsToValueSets = async (rows: QueryResultRow[]) => {
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
      // External ID might not be defined for user-defined valuesets
      valueSetExternalId: conceptGroup[0]["valueset_external_id"]
        ? conceptGroup[0]["valueset_external_id"]
        : undefined,
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
  let errorArray: string[] = [];

  const insertValueSetPromise = generateValueSetSqlPromise(vs);
  try {
    await insertValueSetPromise;
  } catch (e) {
    console.error(
      `ValueSet insertion for ${vs.valueSetId}_${vs.valueSetVersion} failed`,
    );
    console.error(e);
    errorArray.push("Error occured in valuset insertion");
  }

  const insertConceptsPromiseArray = generateConceptSqlPromises(vs);
  const conceptInsertResults = await Promise.allSettled(
    insertConceptsPromiseArray,
  );

  const allConceptInsertsSucceed = conceptInsertResults.every(
    (r) => r.status === "fulfilled",
  );

  if (!allConceptInsertsSucceed) {
    logRejectedPromiseReasons(conceptInsertResults, "Concept insertion failed");
    errorArray.push("Error occured in concept insertion");
  }

  const joinInsertsPromiseArray = generateValuesetConceptJoinSqlPromises(vs);
  const joinInsertResults = await Promise.allSettled(joinInsertsPromiseArray);

  const allJoinInsertsSucceed = joinInsertResults.every(
    (r) => r.status === "fulfilled",
  );

  if (!allJoinInsertsSucceed) {
    logRejectedPromiseReasons(
      joinInsertResults,
      "ValueSet <> concept join insert failed",
    );
    errorArray.push("Error occured in ValueSet <> concept join seeding");
  }

  if (errorArray.length === 0) return { success: true };
  return { success: false, error: errorArray.join(",") };
}

/**
 * Helper function to generate the SQL needed for valueset insertion.
 * @param vs - The ValueSet in of the shape of our internal data model to insert
 * @returns The SQL statement for insertion
 */
function generateValueSetSqlPromise(vs: ValueSet) {
  const valueSetOid = vs.valueSetId;

  const valueSetUniqueId = `${valueSetOid}_${vs.valueSetVersion}`;
  const insertValueSetSql =
    "INSERT INTO valuesets VALUES($1,$2,$3,$4,$5,$6) RETURNING id;";
  const valuesArray = [
    valueSetUniqueId,
    valueSetOid,
    vs.valueSetVersion,
    vs.valueSetName,
    vs.author,
    vs.ersdConceptType,
  ];

  return dbClient.query(insertValueSetSql, valuesArray);
}

/**
 * Helper function to generate the SQL needed for concept / valueset join insertion
 * needed during valueset creation.
 * @param vs - The ValueSet in of the shape of our internal data model to insert
 * @returns The SQL statement array for all concepts for insertion
 */
function generateConceptSqlPromises(vs: ValueSet) {
  const insertConceptsSqlArray = vs.concepts.map((concept) => {
    const systemPrefix = stripProtocolAndTLDFromSystemUrl(vs.system);
    const conceptUniqueId = `${systemPrefix}_${concept.code}`;
    const insertConceptSql = `INSERT INTO concepts VALUES($1,$2,$3,$4,$5,$6) RETURNING id;`;
    const conceptInsertPromise = dbClient.query(insertConceptSql, [
      conceptUniqueId,
      concept.code,
      vs.system,
      concept.display,
      // see notes in constants file for the intentional empty strings
      INTENTIONAL_EMPTY_STRING_FOR_GEM_CODE,
      INTENTIONAL_EMPTY_STRING_FOR_CONCEPT_VERSION,
    ]);

    return conceptInsertPromise;
  });

  return insertConceptsSqlArray;
}

function generateValuesetConceptJoinSqlPromises(vs: ValueSet) {
  const valueSetUniqueId = `${vs.valueSetId}_${vs.valueSetVersion}`;
  const insertConceptsSqlArray = vs.concepts.map((concept) => {
    const systemPrefix = stripProtocolAndTLDFromSystemUrl(vs.system);
    const conceptUniqueId = `${systemPrefix}_${concept.code}`;
    const insertJoinSql = `INSERT INTO valueset_to_concept VALUES($1,$2, $3) RETURNING valueset_id, concept_id;`;
    const conceptInsertPromise = dbClient.query(insertJoinSql, [
      `${valueSetUniqueId}_${conceptUniqueId}`,
      valueSetUniqueId,
      conceptUniqueId,
    ]);

    return conceptInsertPromise;
  });

  return insertConceptsSqlArray;
}

function stripProtocolAndTLDFromSystemUrl(systemURL: string) {
  const match = systemURL.match(/https?:\/\/([^\.]+)/);
  return match ? match[1] : systemURL;
}

function logRejectedPromiseReasons<T>(
  resultsArray: PromiseSettledResult<T>[],
  errorMessageString: string,
) {
  return resultsArray
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => {
      console.error(errorMessageString);
      console.error(r.reason);
      return r.reason;
    });
}

/**
 * Function that orchestrates query insertion for the query building flow
 * @param input - Values of the shape UserQueryInput needed for query insertion
 * @returns - Success or failure status, with associated error message for frontend
 */
export async function insertUserDefinedQuery(input: UserQueryInput) {
  const { sql, values } = generateUserDefinedQueryInsertionSql(input);
  const insertUserQueryPromise = dbClient.query(sql, values);
  const errorArray = [];

  let queryId;
  try {
    const results = await insertUserQueryPromise;
    queryId = results.rows[0].id as unknown as UUID;
  } catch (e) {
    console.error(
      `Error occured in user query insertion: insertion for ${input.queryName} failed`,
    );
    console.error(e);
    errorArray.push("Error occured in user query insertion");

    return { success: false, error: errorArray.join(",") };
  }

  const insertJoinSqlArray = generateUserDefinedQueryToValueSetInsertionSql(
    input,
    queryId as UUID,
  );

  const joinPromises = insertJoinSqlArray.map((q) => {
    dbClient.query(q.sql, q.values);
  });

  const joinInsertResults = await Promise.allSettled(joinPromises);

  const jointInsertsSucceeded = joinInsertResults.every(
    (r) => r.status === "fulfilled",
  );

  if (!jointInsertsSucceeded) {
    logRejectedPromiseReasons(joinInsertResults, "Concept insertion failed");
    errorArray.push("Error occured in concept insertion");
  }

  if (errorArray.length === 0) return { success: true };
  return { success: false, error: errorArray.join(",") };
}
