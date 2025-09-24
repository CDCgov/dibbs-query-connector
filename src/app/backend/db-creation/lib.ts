"use server";

import { Concept } from "@/app/models/entities/concepts";
import { ersdToDibbsConceptMap } from "../../constants";
import { Bundle, ValueSet } from "fhir/r4";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { PoolClient } from "pg";
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
  insertDemoQueryLogicSql,
  insertValueSetSql,
  insertValuesetToConceptSql,
  QueryDataStruct,
  ValuesetStruct,
  ValuesetToConceptStruct,
} from "./seedSqlStructs";
import dbService from "../db/service";
import { getERSD, getVSACValueSet, OidData } from "../code-systems/service";
import {
  generateConceptSqlPromises,
  generateValuesetConceptJoinSqlPromises,
  indexErsdByOid,
  stripProtocolAndTLDFromSystemUrl,
} from "./utils";
import { readJsonFromRelativePath } from "./service";

/**
 * helper function to generate VSAC promises
 *
 * @param oidsToFetch - OIDs from the eRSD to query from VSAC
 * @returns Promises to resolve that will give you the requested VSAC valuesets
 */
export async function generateBatchVsacPromises(oidsToFetch: string[]) {
  const valueSetPromises = Promise.allSettled(
    oidsToFetch.map(async (oid) => {
      // First, we'll pull the value set from VSAC and map it to our representation
      const vs = await getVSACValueSet(oid);
      return { vs: vs, oid: oid };
    }),
  );

  return valueSetPromises;
}

/**
 * Function call to insert a new ValueSet into the database.
 * @param vs - a ValueSet in of the shape of our internal data model to insert
 * @param dbClient - The client to be used to allow seeding to be transactional. We
 * neeed to manually manage the client connection rather than delegating it to the
 * pool because of the cross-relationships in the seeding data.
 * @returns success / failure information, as well as errors as appropriate
 */
export async function insertValueSet(vs: DibbsValueSet, dbClient: PoolClient) {
  // Insert the value set
  const insertedId = await generateValueSetSqlPromise(vs, dbClient);

  // Insert concepts (sequentially)
  const conceptInserts = generateConceptSqlPromises(vs, dbClient);
  for (const insert of conceptInserts) {
    await insert;
  }
  // Insert concept-to-valueset joins (sequentially)
  const joinInserts = generateValuesetConceptJoinSqlPromises(vs, dbClient);
  for (const join of joinInserts) {
    await join;
  }

  return insertedId;
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
   * @param dbClient - The client to be used to allow seeding to be transactional. We
   * neeed to manually manage the client connection rather than delegating it to the
   * pool because of the cross-relationships in the seeding data.
   
   * @returns A data structure reporting on missing concepts or value set links.
   */
export async function checkValueSetInsertion(vs: DibbsValueSet) {
  const missingData = {
    missingValueSet: false,
    missingConcepts: [] as Array<string>,
    missingMappings: [] as Array<string>,
  };
  // Check that the value set itself was inserted
  const vsSql = `SELECT * FROM valuesets WHERE oid = $1;`;
  try {
    const result = await dbService.queryWithDbClient(vsSql, [
      vs.valueSetExternalId,
    ]);
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
  const brokenConcepts: string[] = [];

  for (const c of vs.concepts) {
    const systemPrefix = vs.system
      ? stripProtocolAndTLDFromSystemUrl(vs.system)
      : "";
    const conceptId = `${systemPrefix}_${c?.code}`;
    const conceptSql = `SELECT * FROM concepts WHERE id = $1;`;

    try {
      const result = await dbService.queryWithDbClient(conceptSql, [conceptId]);
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
        brokenConcepts.push(conceptId);
      }
    } catch (error) {
      console.error("Couldn't fetch concept with ID %s: ", conceptId, error);
      brokenConcepts.push(conceptId);
    }
  }
  missingData.missingConcepts = brokenConcepts.filter((bc) => bc !== undefined);

  // Confirm that valueset_to_concepts contains all relevant FK mappings
  const mappingSql = `SELECT * FROM valueset_to_concept WHERE valueset_id = $1;`;
  try {
    const result = await dbService.queryWithDbClient(mappingSql, [
      vs.valueSetId,
    ]);
    const rows = result.rows;
    const missingConceptsFromMappings = vs.concepts.map((c) => {
      const systemPrefix = vs.system
        ? stripProtocolAndTLDFromSystemUrl(vs.system)
        : "";
      const conceptUniqueId = `${systemPrefix}_${c.code}`;

      // Accumulate unique IDs of any concept we can't find among query rows
      const fIdx = rows.findIndex((r) => r["conceptId"] === conceptUniqueId);
      if (fIdx === -1) {
        console.error(
          "Couldn't locate concept " + conceptUniqueId + " in fetched mappings",
        );
        return conceptUniqueId;
      }
    });
    missingData.missingMappings = missingConceptsFromMappings.filter(
      (item) => item !== undefined,
    ) as string[];
  } catch (error) {
    console.error(
      "Couldn't fetch value set to concept mappings for this valueset: ",
      error,
    );
    const systemPrefix = vs.system
      ? stripProtocolAndTLDFromSystemUrl(vs.system)
      : "";
    vs.concepts.forEach((c) => {
      const conceptUniqueId = `${systemPrefix}_${c.code}`;
      missingData.missingMappings.push(conceptUniqueId);
    });
  }

  return missingData;
}

/**
 * Generalized function for reading JSON data out of a file, parsing it
 * into an array of database compatibile structures, and using the Connection
 * Pool to insert them. Files must be located in the mounted /assets
 * directory.
 * @param structType The type of structure to be inserted (e.g. valueset,
 * concept, etc.).
 * @param dbClient - The client to be used to allow seeding to be transactional. We
 * neeed to manually manage the client connection rather than delegating it to the
 * pool because of the cross-relationships in the seeding data.
 */
export async function insertSeedDbStructs(
  structType: string,
  dbClient: PoolClient,
) {
  const data: string | undefined = await readJsonFromRelativePath(
    "dibbs_db_seed_" + structType + ".json",
  );
  if (data) {
    const parsed: {
      [key: string]: Array<dbInsertStruct>;
    } = JSON.parse(data);
    await insertDBStructArray(parsed[structType], structType, dbClient);
  } else {
    console.error("Could not load JSON data for", structType);
  }
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
  const result = await dbService.query(query);

  // Return true if the estimated count > 0, otherwise false
  return (
    result.rows.length > 0 && parseFloat(result.rows[0].estimatedCount) > 0
  );
}

/**
 * Generic function for inserting a variety of different DB structures
 * into the databse during seeding.
 * @param structs An array of structures that's been extracted from a file.
 * @param insertType The type of structure being inserted.
 * @param dbClient - The client to be used to allow seeding to be transactional. We
 * neeed to manually manage the client connection rather than delegating it to the
 * pool because of the cross-relationships in the seeding data.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function insertDBStructArray(
  structs: dbInsertStruct[],
  insertType: string,
  dbClient: PoolClient,
): Promise<{ success: boolean }> {
  let insertSql = "";
  const errors: string[] = [];

  for (const struct of structs) {
    let values: string[] = [];

    switch (insertType) {
      case "valuesets":
        insertSql = insertValueSetSql;
        values = [
          (struct as ValuesetStruct).id,
          (struct as ValuesetStruct).oid,
          (struct as ValuesetStruct).version,
          (struct as ValuesetStruct).name,
          (struct as ValuesetStruct).author,
          (struct as ValuesetStruct).type,
          (struct as ValuesetStruct).dibbsConceptType,
          (struct as ValuesetStruct).userCreated,
        ];
        break;
      case "concepts":
        insertSql = insertConceptSql;
        values = [
          (struct as ConceptStruct).id,
          (struct as ConceptStruct).code,
          (struct as ConceptStruct).codeSystem,
          (struct as ConceptStruct).display,
        ];
        break;
      case "valueset_to_concept":
        insertSql = insertValuesetToConceptSql;
        values = [
          (struct as ValuesetToConceptStruct).id,
          (struct as ValuesetToConceptStruct).valueSetId,
          (struct as ValuesetToConceptStruct).conceptId,
        ];
        break;
      case "conditions":
        insertSql = insertConditionSql;
        values = [
          (struct as ConditionStruct).id,
          (struct as ConditionStruct).system,
          (struct as ConditionStruct).name,
          (struct as ConditionStruct).version,
          (struct as ConditionStruct).category,
        ];
        break;
      case "condition_to_valueset":
        insertSql = insertConditionToValuesetSql;
        values = [
          (struct as ConditionToValueSetStruct).id,
          (struct as ConditionToValueSetStruct).conditionId,
          (struct as ConditionToValueSetStruct).valueSetId,
          (struct as ConditionToValueSetStruct).source,
        ];
        break;
      case "category":
        insertSql = insertCategorySql;
        values = [
          (struct as CategoryStruct).conditionName,
          (struct as CategoryStruct).conditionCode,
          (struct as CategoryStruct).category,
        ];
        break;
      case "query":
        insertSql = insertDemoQueryLogicSql;
        values = [
          (struct as QueryDataStruct).queryName,
          (struct as QueryDataStruct).queryData,
          (struct as QueryDataStruct).conditionsList,
          (struct as QueryDataStruct).author,
          (struct as QueryDataStruct).dateCreated,
          (struct as QueryDataStruct).dateLastModified,
        ];
        break;
    }

    await dbClient.query(insertSql, values);
  }

  return errors.length === 0 ? { success: true } : { success: false };
}

/**
 * Helper function that execute the category data updates for inserted conditions.
 * @param vs - The ValueSet in of the shape of our internal data model to insert
 * @param dbClient - Specific managed DbClient to prevent transaction errors
 * @returns The SQL statement array for the value set for insertion
 */
export async function generateValueSetSqlPromise(
  vs: DibbsValueSet,
  dbClient: PoolClient,
) {
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
    vs.userCreated ?? false,
  ];
  return dbClient.query(insertValueSetSql, valuesArray);
}

/**
 * Helper function to clean url-related info from system fields
 * @param systemURL - system to clean
 * @returns the slug of the URL that includes only the system information
 */

type ersdCondition = {
  code: string;
  system: string;
  text: string;
  valueset_id: string;
};
/**
 * Performs eRSD querying and parsing to generate OIDs and extract clinical
 * concepts from the eRSD. First, a call is made to the eRSD, which is filtered
 * for valuesets. These valusets are used to create a mapping between OID and
 * clinical service code, as well as to actually compile the list of OIDs of all
 * valuesets in the pull-down. Then, these two entities are bundled together
 * as a data structure for future scripting.
 * @returns An OidData object containing the OIDs extracted as well as the
 * clinical service type associated with each.
 */
export async function indexErsdResponseByOid() {
  console.log("Fetching and parsing eRSD.");
  const ersd = await getERSD();

  const valuesets = (ersd as unknown as Bundle)["entry"]?.filter(
    (e) => e.resource?.resourceType === "ValueSet",
  );

  const { nonUmbrellaValueSets, oidToErsdType } = indexErsdByOid(valuesets);
  // Build up a mapping of OIDs to eRSD clinical types

  let conditionExtractor: Array<ersdCondition> = [];
  nonUmbrellaValueSets.reduce((acc: Array<ersdCondition>, vs: ValueSet) => {
    const conditionSchemes = vs.useContext?.filter(
      (context) =>
        !(context.valueCodeableConcept?.coding || [])[0].system?.includes(
          "us-ph-usage-context",
        ),
    );
    (conditionSchemes || []).forEach((usc) => {
      const ersdCond: ersdCondition = {
        code: (usc.valueCodeableConcept?.coding || [])[0].code || "",
        system: (usc.valueCodeableConcept?.coding || [])[0].system || "",
        text: usc.valueCodeableConcept?.text || "",
        valueset_id: vs.id || "",
      };
      conditionExtractor.push(ersdCond);
    });
    return conditionExtractor;
  }, conditionExtractor);

  // Make sure to take out the umbrella value sets from the ones we try to insert
  let oids = valuesets?.map((vs) => vs.resource?.id);
  oids = oids?.filter(
    (oid) => !Object.keys(ersdToDibbsConceptMap).includes(oid || ""),
  );
  return {
    oids: oids,
    oidToErsdType: oidToErsdType,
    conditions: conditionExtractor,
  } as OidData;
}
