"use server";
import { Pool, PoolConfig, QueryResultRow } from "pg";
import {
  Bundle,
  OperationOutcome,
  ValueSet as FhirValueSet,
  Parameters,
} from "fhir/r4";
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
  CustomUserQuery,
} from "./query-building";
import { UUID } from "crypto";
import {
  CategoryToConditionArrayMap,
  ConditionIdToNameMap,
} from "./queryBuilding/utils";
import {
  CategoryStruct,
  ConceptStruct,
  ConditionStruct,
  ConditionToValueSetStruct,
  dbInsertStruct,
  insertCategorySql,
  insertConceptSql,
  insertConditionSql,
  insertConditionToValuesetSql,
  insertDefaultQueryLogicSql,
  insertValueSetSql,
  insertValuesetToConceptSql,
  updatedCancerCategorySql,
  updateErsdCategorySql,
  updateNewbornScreeningCategorySql,
  ValuesetStruct,
  ValuesetToConceptStruct,
} from "./seedSqlStructs";

const getQuerybyNameSQL = `
select q.query_name, q.id
  from query q 
  where q.query_name = $1;
`;

// Load environment variables from .env and establish a Pool configuration
const dbConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum # of connections in the pool
  idleTimeoutMillis: 30000, // A client must sit idle this long before being released
  connectionTimeoutMillis: 10000, // Wait this long before timing out when connecting new client
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
 * Utility function to execute the insertions into three query tables
 * programmatically after the database has been seeded with initial
 * conditions.
 */
export const executeDefaultQueryCreation = async () => {
  try {
    console.log("Executing default query linking script");
    await dbClient.query(insertDefaultQueryLogicSql);
    console.log(
      "Default queries, queries to conditions, and query included concepts insertion complete",
    );
  } catch (error) {
    console.error("Could not cross-index default queries", error);
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
type ErsdOrVsacResponse = Bundle | Parameters | OperationOutcome;

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
 * @param searchStructType Optionally, a flag to identify what type of
 * search to perform, since VSAC can be used for value sets as well as conditions.
 * @param codeSystem Optional parameter for use with condition querying.
 * @returns The value sets as a FHIR bundle, or an Operation Outcome if there is an error.
 */
export async function getVSACValueSet(
  oid: string,
  searchStructType: string = "valueset",
  codeSystem?: string,
): Promise<ErsdOrVsacResponse> {
  const username: string = "apikey";
  const umlsKey: string = process.env.UMLS_API_KEY || "";
  const vsacUrl: string =
    searchStructType === "valueset"
      ? `https://cts.nlm.nih.gov/fhir/ValueSet/${oid}`
      : `https://cts.nlm.nih.gov/fhir/CodeSystem/$lookup?system=${codeSystem}&code=${oid}`;
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
  const valuesArray = [
    valueSetUniqueId,
    valueSetOid,
    vs.valueSetVersion,
    vs.valueSetName,
    vs.author,
    vs.dibbsConceptType,
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
    const conceptInsertPromise = dbClient.query(insertValuesetToConceptSql, [
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
      `Error occured in user query insertion: insertion for ${input.queryName} failed`,
    );
    console.error(e);
    errorArray.push("Error occured in user query insertion");

    return { success: false, error: errorArray.join(",") };
  }
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
        "Retrieved value set information differs from given value set",
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
      const conceptId = `${systemPrefix}_${c?.code}`;
      const conceptSql = `SELECT * FROM concepts WHERE id = $1;`;

      try {
        const result = await dbClient.query(conceptSql, [conceptId]);
        const foundConcept: Concept = result.rows[0];

        // We accumulate the unique DIBBs concept IDs of anything that's missing
        if (
          foundConcept?.code !== c?.code ||
          foundConcept?.display !== c?.display
        ) {
          console.error(
            "Retrieved concept " +
              conceptId +
              " has different values than given concept",
          );
          return conceptId;
        }
      } catch (error) {
        console.error(
          "Couldn't fetch concept with ID " + conceptId + ": ",
          error,
        );
        return conceptId;
      }
    }),
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
          "Couldn't locate concept " + conceptUniqueId + " in fetched mappings",
        );
        return conceptUniqueId;
      }
    });
    missingData.missingMappings = missingConceptsFromMappings.filter(
      (item) => item !== undefined,
    );
  } catch (error) {
    console.error(
      "Couldn't fetch value set to concept mappings for this valueset: ",
      error,
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
    {} as CategoryToConditionArrayMap,
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
 * Generic function for inserting a variety of different DB structures
 * into the databse during seeding.
 * @param structs An array of structures that's been extracted from a file.
 * @param insertType The type of structure being inserted.
 */
export async function insertDBStructArray(
  structs: dbInsertStruct[],
  insertType: string,
) {
  const allStructPromises = structs.map((struct) => {
    let structInsertSql: string = "";
    let valuesToInsert: string[] = [];
    if (insertType === "valuesets") {
      structInsertSql = insertValueSetSql;
      valuesToInsert = [
        (struct as ValuesetStruct).id,
        (struct as ValuesetStruct).oid,
        (struct as ValuesetStruct).version,
        (struct as ValuesetStruct).name,
        (struct as ValuesetStruct).author,
        (struct as ValuesetStruct).type,
        (struct as ValuesetStruct).dibbs_concept_type,
      ];
    } else if (insertType === "concepts") {
      structInsertSql = insertConceptSql;
      valuesToInsert = [
        (struct as ConceptStruct).id,
        (struct as ConceptStruct).code,
        (struct as ConceptStruct).code_system,
        (struct as ConceptStruct).display,
        INTENTIONAL_EMPTY_STRING_FOR_GEM_CODE,
        (struct as ConceptStruct).version,
      ];
    } else if (insertType === "valueset_to_concept") {
      structInsertSql = insertValuesetToConceptSql;
      valuesToInsert = [
        (struct as ValuesetToConceptStruct).id,
        (struct as ValuesetToConceptStruct).valueset_id,
        (struct as ValuesetToConceptStruct).concept_id,
      ];
    } else if (insertType === "conditions") {
      structInsertSql = insertConditionSql;
      valuesToInsert = [
        (struct as ConditionStruct).id,
        (struct as ConditionStruct).system,
        (struct as ConditionStruct).name,
        (struct as ConditionStruct).version,
        (struct as ConditionStruct).category,
      ];
    } else if (insertType === "condition_to_valueset") {
      structInsertSql = insertConditionToValuesetSql;
      valuesToInsert = [
        (struct as ConditionToValueSetStruct).id,
        (struct as ConditionToValueSetStruct).condition_id,
        (struct as ConditionToValueSetStruct).valueset_id,
        (struct as ConditionToValueSetStruct).source,
      ];
    } else if (insertType === "category") {
      structInsertSql = insertCategorySql;
      valuesToInsert = [
        (struct as CategoryStruct).condition_name,
        (struct as CategoryStruct).condition_code,
        (struct as CategoryStruct).category,
      ];
    }
    const insertPromise = dbClient.query(structInsertSql, valuesToInsert);
    return insertPromise;
  });

  const allStructsInserted = await Promise.allSettled(allStructPromises);
  if (allStructsInserted.every((p) => p.status === "fulfilled")) {
    console.log("All", insertType, "inserted");
  } else {
    console.error("Problem inserting ", insertType);
  }
}

/**
 * Helper function that execute the category data updates for inserted conditions.
 */
export const executeCategoryUpdates = async () => {
  try {
    console.log("Executing category data updates on inserted conditions");
    await dbClient.query(updateErsdCategorySql);
    await dbClient.query(updateNewbornScreeningCategorySql);
    await dbClient.query(updatedCancerCategorySql);
    await dbClient.query(`DROP TABLE category_data`);
    console.log("All inserted queries cross-referenced with category data");
  } catch (error) {
    console.error("Could not update categories for inserted conditions", error);
  }
};

/**
 * Fetches and structures custom user queries from the database.
 * Executes a SQL query to join query information with related valueset and concept data,
 * and then structures the result into a nested JSON format. The JSON format groups
 * valuesets and their nested concepts under each query.
 * @returns customUserQueriesArray - An array of objects where each object represents a query.
 * Each query object includes:
 * - query_id: The unique identifier for the query.
 * - query_name: The name of the query.
 * - valuesets: An array of ValueSet objects
 * - concepts: An array of Concept objects
 */
export async function getCustomQueries(): Promise<CustomUserQuery[]> {
  const query = `
    SELECT
      q.id AS query_id,
      q.query_name,
      vc.valueset_id AS valueSetId,
      vc.version AS valueSetVersion,
      vc.valueset_name AS valueSetName,
      vc.author,
      vc.system,
      vc.ersd_concept_type AS ersdConceptType,
      vc.dibbs_concept_type AS dibbsConceptType,
      vc.valueset_include AS includeValueSet,
      vc.code,
      vc.display,
      qic.include AS concept_include
    FROM
      query q
    LEFT JOIN (
      SELECT
        v.id AS valueset_id,
        v.version,
        v.name AS valueset_name,
        v.author,
        c.code_system AS system,
        v.type AS ersd_concept_type,
        v.dibbs_concept_type,
        true AS valueset_include,
        c.code,
        c.display
      FROM
        valuesets v
      LEFT JOIN valueset_to_concept vtc ON vtc.valueset_id = v.id
      LEFT JOIN concepts c ON c.id = vtc.concept_id
    ) vc ON vc.valueset_id = qtv.valueset_id
    WHERE     q.query_name IN ('Gonorrhea (disorder)', 'Newborn Screening', 'Syphilis (disorder)', 'Cancer (Leukemia)', 'Chlamydia trachomatis infection (disorder)');
  `;
  // TODO: We will need to refactor this to just pull query_name and conditions_list
  // TODO: this will eventually need to take into account user permissions and specific authors
  // We might also be able to take advantage of the `query_name` var to avoid joining valuesets/conc

  const results = await dbClient.query(query);
  const formattedData: { [key: string]: CustomUserQuery } = {};

  results.rows.forEach((row) => {
    const {
      query_id,
      query_name,
      valueSetId,
      valueSetVersion,
      valueSetName,
      author,
      system,
      ersdConceptType,
      dibbsConceptType,
      includeValueSet,
      code,
      display,
      concept_include,
    } = row;

    // Initialize query structure if it doesn't exist
    if (!formattedData[query_id]) {
      formattedData[query_id] = {
        query_id,
        query_name,
        valuesets: [],
      };
    }

    // Check if the valueSetId already exists in the valuesets array
    let valueset = formattedData[query_id].valuesets.find(
      (v) => v.valueSetId === valueSetId,
    );

    // If valueSetId doesn't exist, add it
    if (!valueset) {
      valueset = {
        valueSetId,
        valueSetVersion,
        valueSetName,
        author,
        system,
        ersdConceptType,
        dibbsConceptType,
        includeValueSet,
        concepts: [],
      };
      formattedData[query_id].valuesets.push(valueset);
    }

    // Add concept data to the concepts array
    const concept: Concept = { code, display, include: concept_include };
    valueset.concepts.push(concept);
  });

  return Object.values(formattedData);
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
