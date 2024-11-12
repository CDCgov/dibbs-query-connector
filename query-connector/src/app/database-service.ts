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
  QueryInput,
  generateQueryInsertionSql,
  generateQueryToValueSetInsertionSql,
} from "./query-building";
import { UUID } from "crypto";
import {
  CategoryToConditionArrayMap,
  ConditionIdToNameMap,
} from "./queryBuilding/utils";

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
      ersdConceptType: conceptGroup[0]["type"]
        ? conceptGroup[0]["type"]
        : undefined,
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
  eRSDVersion: number = 3
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
  oid: string
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
  ersdConceptType: ErsdConceptType
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
      `ValueSet insertion for ${vs.valueSetId}_${vs.valueSetVersion} failed`
    );
    console.error(e);
    errorArray.push("Error occured in valuset insertion");
  }

  const insertConceptsPromiseArray = generateConceptSqlPromises(vs);
  const conceptInsertResults = await Promise.allSettled(
    insertConceptsPromiseArray
  );

  const allConceptInsertsSucceed = conceptInsertResults.every(
    (r) => r.status === "fulfilled"
  );

  if (!allConceptInsertsSucceed) {
    logRejectedPromiseReasons(conceptInsertResults, "Concept insertion failed");
    errorArray.push("Error occured in concept insertion");
  }

  const joinInsertsPromiseArray = generateValuesetConceptJoinSqlPromises(vs);
  const joinInsertResults = await Promise.allSettled(joinInsertsPromiseArray);

  const allJoinInsertsSucceed = joinInsertResults.every(
    (r) => r.status === "fulfilled"
  );

  if (!allJoinInsertsSucceed) {
    logRejectedPromiseReasons(
      joinInsertResults,
      "ValueSet <> concept join insert failed"
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
  const valueSetOid = vs.valueSetExternalId;

  // TODO: based on how non-VSAC valuests are shaped in the future, we may need
  // to update the ID scheme to have something more generically defined that
  // don't rely on potentially null external ID values.
  const valueSetUniqueId = `${valueSetOid}_${vs.valueSetVersion}`;

  // In the event a duplicate value set by OID + Version is entered, simply
  // update the existing one to have the new set of information
  // ValueSets are already uniquely identified by OID + V so this just allows
  // us to proceed with DB creation in the event a duplicate VS from another
  // group is pulled and loaded
  const insertValueSetSql = `
  INSERT INTO valuesets
    VALUES($1,$2,$3,$4,$5,$6)
    ON CONFLICT(id)
    DO UPDATE SET
      id = EXCLUDED.id,
      oid = EXCLUDED.oid,
      version = EXCLUDED.version,
      name = EXCLUDED.name,
      author = EXCLUDED.author,
      type = EXCLUDED.type
    RETURNING id;
  `;
  const valuesArray = [
    valueSetUniqueId,
    valueSetOid,
    vs.valueSetVersion,
    vs.valueSetName,
    vs.author,
    vs.dibbsConceptType,
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

    // Duplicate value set insertion is likely to percolate to the concept level
    // Apply the same logic of overwriting if unique keys are the same
    const insertConceptSql = `
    INSERT INTO concepts
      VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT(id)
      DO UPDATE SET
        id = EXCLUDED.id,
        code = EXCLUDED.code,
        code_system = EXCLUDED.code_system,
        display = EXCLUDED.display,
        gem_formatted_code = EXCLUDED.gem_formatted_code,
        version = EXCLUDED.version
      RETURNING id;
    `;
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
  const insertConceptsSqlArray = vs.concepts.map((concept) => {
    const systemPrefix = stripProtocolAndTLDFromSystemUrl(vs.system);
    const conceptUniqueId = `${systemPrefix}_${concept.code}`;

    // Last place to make an overwriting upsert adjustment
    // Even if the duplicate entries have the same data, PG will attempt to
    // insert another row, so just make that upsert the relationship
    const insertJoinSql = `
    INSERT INTO valueset_to_concept
    VALUES($1,$2,$3)
    ON CONFLICT(id)
    DO UPDATE SET
      id = EXCLUDED.id,
      valueset_id = EXCLUDED.valueset_id,
      concept_id = EXCLUDED.concept_id
    RETURNING valueset_id, concept_id;
    `;
    const conceptInsertPromise = dbClient.query(insertJoinSql, [
      `${vs.valueSetId}_${conceptUniqueId}`,
      vs.valueSetId,
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
  errorMessageString: string
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
 * @param input - Values of the shape QueryInput needed for query insertion
 * @returns - Success or failure status, with associated error message for frontend
 */
export async function insertQuery(input: QueryInput) {
  const { sql, values } = generateQueryInsertionSql(input);
  const insertUserQueryPromise = dbClient.query(sql, values);
  const errorArray = [];

  let queryId;
  try {
    const results = await insertUserQueryPromise;
    queryId = results.rows[0].id as unknown as UUID;
  } catch (e) {
    console.error(
      `Error occured in user query insertion: insertion for ${input.queryName} failed`
    );
    console.error(e);
    errorArray.push("Error occured in user query insertion");

    return { success: false, error: errorArray.join(",") };
  }

  const insertJoinSqlArray = generateQueryToValueSetInsertionSql(
    input,
    queryId as UUID
  );

  const joinPromises = insertJoinSqlArray.map((q) => {
    dbClient.query(q.sql, q.values);
  });

  const joinInsertResults = await Promise.allSettled(joinPromises);

  const joinInsertsSucceeded = joinInsertResults.every(
    (r) => r.status === "fulfilled"
  );

  if (!joinInsertsSucceeded) {
    logRejectedPromiseReasons(joinInsertResults, "Concept insertion failed");
    errorArray.push("Error occured in concept insertion");
  }

  if (errorArray.length === 0) return { success: true };
  return { success: false, error: errorArray.join(",") };
}

/**
 * Function that verifies that a particular value set and all its affiliated
 * concepts were successfully inserted into the DB. Given a FHIR formatted
 * value set, the function checks three things:
 *   1. Whether the value set itself was inserted
 *   2. Whether each concept included in that value set bundle was inserted
 *   3. Whether these concepts are now mapped to this value set via foreign key
 * If any data is found to be missing, it is collected and logged to the user.
 * @param vs The DIBBs internal representation of the value set to check.
 * @returns A data structure reporting on missing concepts or value set links.
 */
export async function checkValueSetInsertion(vs: ValueSet) {
  // Begin accumulating missing data
  const missingData = {
    missingValueSet: false,
    missingConcepts: [] as Array<String>,
    missingMappings: [] as Array<String>,
  };

  // Check that the value set itself was inserted
  const vsSql = `SELECT * FROM valuesets WHERE oid = $1;`;
  try {
    const result = await dbClient.query(vsSql, [vs.valueSetExternalId]);
    const foundVS = result.rows[0];
    if (
      foundVS.version !== vs.valueSetVersion ||
      foundVS.name !== vs.valueSetName ||
      foundVS.author !== vs.author
    ) {
      console.error(
        "Retrieved value set information differs from given value set"
      );
      missingData.missingValueSet = true;
    }
  } catch (error) {
    console.error("Couldn't fetch inserted value set from DB: ", error);
    missingData.missingValueSet = true;
  }

  // Check that all concepts under the value set's umbrella were inserted
  const brokenConcepts = await Promise.all(
    vs.concepts.map(async (c) => {
      const systemPrefix = stripProtocolAndTLDFromSystemUrl(vs.system);
      const conceptId = `${systemPrefix}_${c.code}`;
      const conceptSql = `SELECT * FROM concepts WHERE id = $1;`;

      try {
        const result = await dbClient.query(conceptSql, [conceptId]);
        const foundConcept: Concept = result.rows[0];

        // We accumulate the unique DIBBs concept IDs of anything that's missing
        if (
          foundConcept.code !== c.code ||
          foundConcept.display !== c.display
        ) {
          console.error(
            "Retrieved concept " +
              conceptId +
              " has different values than given concept"
          );
          return conceptId;
        }
      } catch (error) {
        console.error(
          "Couldn't fetch concept with ID " + conceptId + ": ",
          error
        );
        return conceptId;
      }
    })
  );
  missingData.missingConcepts = brokenConcepts.filter((bc) => bc !== undefined);

  // Confirm that valueset_to_concepts contains all relevant FK mappings
  const mappingSql = `SELECT * FROM valueset_to_concept WHERE valueset_id = $1;`;
  try {
    const result = await dbClient.query(mappingSql, [vs.valueSetId]);
    const rows = result.rows;
    const missingConceptsFromMappings = vs.concepts.map((c) => {
      const systemPrefix = stripProtocolAndTLDFromSystemUrl(vs.system);
      const conceptUniqueId = `${systemPrefix}_${c.code}`;

      // Accumulate unique IDs of any concept we can't find among query rows
      const fIdx = rows.findIndex((r) => r["concept_id"] === conceptUniqueId);
      if (fIdx === -1) {
        console.error(
          "Couldn't locate concept " + conceptUniqueId + " in fetched mappings"
        );
        return conceptUniqueId;
      }
    });
    missingData.missingMappings = missingConceptsFromMappings.filter(
      (item) => item !== undefined
    );
  } catch (error) {
    console.error(
      "Couldn't fetch value set to concept mappings for this valueset: ",
      error
    );
    const systemPrefix = stripProtocolAndTLDFromSystemUrl(vs.system);
    vs.concepts.forEach((c) => {
      const conceptUniqueId = `${systemPrefix}_${c.code}`;
      missingData.missingMappings.push(conceptUniqueId);
    });
  }

  return missingData;
}

/**
 * Retrieves all records from the conditions table in the database.
 * This function queries the database to fetch condition data, including
 * condition name, code, and category.
 * @returns An object containing:
 * - `conditionCatergories`: a JSON object grouped by category with id:name pairs,
 * to display on build-query page
 * - `conditionLookup`: a JSON object with id as the key and name as the value in
 * order to make a call to the DB with the necessary ID(s) to get the valuesets
 * on subsequent pages.
 */
export async function getConditionsData() {
  const query = "SELECT * FROM conditions";
  const result = await dbClient.query(query);
  const rows = result.rows;

  // 1. Grouped by category with id:name pairs
  const categoryToConditionArrayMap: CategoryToConditionArrayMap = rows.reduce(
    (acc, row) => {
      const { category, id, name } = row;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({ [id]: name });
      return acc;
    },
    {} as CategoryToConditionArrayMap
  );

  // 2. ID-Name mapping
  const conditionIdToNameMap: ConditionIdToNameMap = rows.reduce((acc, row) => {
    acc[row.id] = row.name;
    return acc;
  }, {} as ConditionIdToNameMap);
  return {
    categoryToConditionArrayMap,
    conditionIdToNameMap,
  } as const;
}

/**
 * Checks the database to see if data has been loaded into the valuesets table by
 * estmating the number of rows in the table. If the estimated count is greater than
 * 0, the function returns true, otherwise false.
 * @returns A boolean indicating whether the valuesets table has data.
 */
export async function checkDBForData() {
  const query = `
    SELECT reltuples AS estimated_count
    FROM pg_class
    WHERE relname = 'valuesets';
  `;
  const result = await dbClient.query(query);

  // Return true if the estimated count > 0, otherwise false
  return (
    result.rows.length > 0 && parseFloat(result.rows[0].estimated_count) > 0
  );
}
