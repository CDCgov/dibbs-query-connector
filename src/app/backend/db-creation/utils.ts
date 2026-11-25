// Utils file for any code that doesn't need to be async, which is a requirement
// to export out the db-creation server component file
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { insertValuesetToConceptSql, insertConceptSql } from "./seedSqlStructs";
import { DbClient } from "../db/service";
import { stripProtocolAndTLDFromSystemUrl } from "@/seed/process-data";

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
