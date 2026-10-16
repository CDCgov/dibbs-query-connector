import {
  MedicalRecordSections,
  NestedQuery,
  QueryTableResult,
  QueryTableTimebox,
  QueryUpdateResult,
} from "@/app/(pages)/queryBuilding/utils";
import {
  DibbsConceptType,
  DibbsValueSet,
} from "@/app/models/entities/valuesets";
import { randomUUID } from "crypto";
import { DbService } from "../db/service";
import { Pool } from "pg";

// The underlying functionality here is reused in Playwright to do some
// test setup, but for some DUMB reason Playwright refuses to play nicely with
// decorators. As a workaround, we're doing some fiddly imports to expose the
// underlying logic away from the decorated exports available in the class exported
// in query-building.ts

/**
 * Backend handler function for upserting a query
 * @param queryInput - frontend input for a query
 * @param queryName - name of query
 * @param author - author
 * @param dbClient - the DB client to execute queries against
 * @param medicalRecordSections - sections of the medical record to include in the query
 * @param queryId - a queryId if previously defined
 * @returns - all columns of the newly added row in the query table
 */
export async function saveCustomQueryHelp(
  queryInput: NestedQuery,
  queryName: string,
  author: string,
  dbClient: DbService | Pool,
  medicalRecordSections: MedicalRecordSections,
  queryId?: string,
) {
  const queryString = `
    INSERT INTO query
      values($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT(id)
      DO UPDATE SET
        query_name = EXCLUDED.query_name,
        conditions_list = EXCLUDED.conditions_list,
        query_data = EXCLUDED.query_data,
        author = EXCLUDED.author,
        date_last_modified = EXCLUDED.date_last_modified,
        medical_record_sections = EXCLUDED.medical_record_sections
      RETURNING id, query_name,  CASE WHEN xmax = 0 THEN 'INSERT' ELSE 'UPDATE' END AS operation;
    `;
  const { queryDataInsert, conditionInsert } =
    formatQueryDataForDatabase(queryInput);

  const NOW = new Date().toISOString();
  try {
    const dataToWrite = [
      queryId ? queryId : randomUUID(),
      queryName,
      queryDataInsert,
      conditionInsert,
      author,
      NOW,
      NOW,
      medicalRecordSections,
    ];
    const result = await dbClient.query(queryString, dataToWrite);
    if (result.rows.length > 0) {
      return result.rows as QueryUpdateResult[];
    }
    console.error("Query save failed:", dataToWrite);
    return [];
  } catch (error) {
    console.error("Error saving new query", error);
  }
}
/**
 * Getter function to grab saved query details from the DB
 * @param queryId - Query ID to grab data from the db with
 * @param dbClient - the DB client to execute queries against
 * @returns The query name, data, and conditions list from the query table
 */
export async function getSavedQueryByIdHelp(
  queryId: string,
  dbClient: DbService | Pool,
) {
  const id = queryId;
  const queryString = `
      select q.query_name, q.id AS query_id, q.query_data, q.conditions_list, q.medical_record_sections
          from query q 
      where q.id = $1
      `;

  try {
    const result = await dbClient.query(queryString, [id]);

    if (result.rows.length === 0) {
      console.info("No results found for query id:", id);
      return undefined;
    }
    return result.rows[0] as unknown as QueryTableResult;
  } catch (error) {
    console.error("Error retrieving query", error);
    throw error;
  }
}

/**
 * Deletes a query from the database by its unique ID.
 * @param queryId - The unique identifier of the query to delete.
 * @param dbClient - the DB client to execute queries against
 * @returns A success or error response indicating the result.
 */
export async function deleteQueryByIdHelp(
  queryId: string,
  dbClient: DbService | Pool,
) {
  const deleteUsergroupToQuery = `
  DELETE FROM usergroup_to_query WHERE query_id = $1;
`;

  const deleteQuery = `
  DELETE FROM query WHERE id = $1;
`;

  try {
    await dbClient.query(deleteUsergroupToQuery, [queryId]);

    const result = await dbClient.query(deleteQuery, [queryId]);
    return result.rowCount === 0
      ? { success: false, error: `No rows were deleted.` }
      : { success: true, id: queryId };
  } catch (error) {
    console.error(`Failed to delete query with ID ${queryId}:`, error);
    return { success: false, error: "Failed to delete the query." };
  }
}

function formatConditionsForPostgres(arr: string[]): string {
  if (arr.length === 0) return "{}";

  const escapedStrings = arr.map((str) => {
    const escaped = str.replace(/"/g, '\\"');
    return `"${escaped}"`;
  });

  return `{${escapedStrings.join(",")}}`;
}

function formatQueryDataForDatabase(frontendInput: NestedQuery) {
  const queryData: Record<string, { [valueSetId: string]: DibbsValueSet }> = {};
  const conditionIds: string[] = [];

  Object.entries(frontendInput).forEach(([conditionId, data]) => {
    queryData[conditionId] = {};
    conditionIds.push(conditionId);
    Object.values(data).forEach((dibbsVsMap) => {
      Object.entries(dibbsVsMap).forEach(([vsId, dibbsVs]) => {
        queryData[conditionId][vsId] = dibbsVs;
      });
    });
  });

  return {
    queryDataInsert: queryData,
    conditionInsert: formatConditionsForPostgres(conditionIds),
  };
}

/**
 * Executes a search for a CustomQuery against the query-loaded Postgres
 * Database, using the saved name associated with the query as the unique
 * identifier by which to load the result.
 * @param name The name given to a stored query in the DB.
 * @param dbClient - the DB client to execute queries against
 * @returns One or more rows from the DB matching the requested saved query,
 * or an error if no results can be found.
 */
export async function getSavedQueryByNameHelp(
  name: string,
  dbClient: DbService | Pool,
) {
  const values = [name];

  const getQuerybyNameSQL = `
  select q.query_name, q.id, q.query_data, q.conditions_list, q.medical_record_sections
  from query q 
  where q.query_name = $1;
`;

  try {
    const result = await dbClient.query(getQuerybyNameSQL, values);
    if (result.rows.length === 0) {
      console.error("No results found for query named:", name);
      return undefined;
    }

    const foundQuery = result.rows[0];
    const timeboxInfo = await linkTimeboxRangesToQueryHelp(
      foundQuery.id,
      dbClient,
    );
    // followup to get timeboxing information

    foundQuery.timeboxWindows = timeboxInfo;
    return foundQuery as unknown as QueryTableResult;
  } catch (error) {
    console.error("Error retrieving query:", error);
    throw error;
  }
}

/**
 * Fetches a query's timebox settings, resolving relative ranges against the
 * current date
 * @param queryId - ID of the query
 * @param dbClient - the DB client to execute queries against
 * @returns The timebox window for each concept type the query sets one for
 */
export async function linkTimeboxRangesToQueryHelp(
  queryId: string,
  dbClient: DbService | Pool,
) {
  const timeboxSql = `SELECT * FROM query_timeboxing WHERE query_id=$1;`;

  const relatedTimeboxes = await dbClient.query(timeboxSql, [queryId]);
  const timeboxInfo: QueryTableTimebox = {};
  relatedTimeboxes.rows.forEach((t) => {
    let timeWindowStart = t.timeWindowStart;
    let timeWindowEnd = t.timeWindowEnd;

    if (t.isRelativeRange) {
      // we want the relative ranges, so take the time delta and apply it to the current date
      const endDate = new Date(timeWindowEnd);
      const startDate = new Date(timeWindowStart);
      const timeDeltaMilliseconds = endDate.getTime() - startDate.getTime();

      timeWindowEnd = new Date();
      timeWindowStart = new Date();
      timeWindowStart.setTime(timeWindowEnd.getTime() - timeDeltaMilliseconds);
    }
    return (timeboxInfo[t.conceptType as DibbsConceptType] = {
      timeWindowStart: timeWindowStart.toISOString(),
      timeWindowEnd: timeWindowEnd.toISOString(),
    });
  });

  return timeboxInfo;
}
