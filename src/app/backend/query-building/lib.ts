import {
  NestedQuery,
  QueryTableResult,
  QueryUpdateResult,
} from "@/app/(pages)/queryBuilding/utils";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { DEFAULT_TIME_WINDOW } from "@/app/shared/utils";
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
 * @param queryId - a queryId if previously defined
 * @returns - all columns of the newly added row in the query table
 */
export async function saveCustomQueryHelp(
  queryInput: NestedQuery,
  queryName: string,
  author: string,
  dbClient: DbService | Pool,
  queryId?: string,
) {
  const queryString = `
    INSERT INTO query
      values($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT(id)
      DO UPDATE SET
        query_name = EXCLUDED.query_name,
        conditions_list = EXCLUDED.conditions_list,
        query_data = EXCLUDED.query_data,
        author = EXCLUDED.author,
        date_last_modified = EXCLUDED.date_last_modified
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
      DEFAULT_TIME_WINDOW.timeWindowNumber,
      DEFAULT_TIME_WINDOW.timeWindowUnit,
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
      select q.query_name, q.id AS query_id, q.query_data, q.conditions_list, q.immunization
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
