"use server";

import { getDbClient } from "./dbClient";
import {
  NestedQuery,
  QueryTableResult,
  QueryUpdateResult,
} from "../(pages)/queryBuilding/utils";
import { DEFAULT_TIME_WINDOW } from "../shared/utils";
import { randomUUID } from "crypto";
import { DibbsValueSet } from "../models/entities/valuesets";
import { adminAccessCheck, superAdminAccessCheck } from "../utils/auth";
import { CustomUserQuery } from "../models/entities/query";
const dbClient = getDbClient();

/**
 * Getter function to grab saved query details from the DB
 * @param queryId - Query ID to grab data from the db with
 * @returns The query name, data, and conditions list from the query table
 */
export async function getSavedQueryById(queryId: string) {
  const id = queryId;
  const queryString = `
    select q.query_name, q.id, q.query_data, q.conditions_list
        from query q 
    where q.id = $1;
    `;

  try {
    const result = await dbClient.query(queryString, [id]);

    if (result.rows.length === 0) {
      console.error("No results found for query id:", id);
      return undefined;
    }
    return result.rows[0] as unknown as QueryTableResult;
  } catch (error) {
    console.error("Error retrieving query", error);
    throw error;
  }
}

/**
 * Backend handler function for upserting a query
 * @param queryInput - frontend input for a query
 * @param queryName - name of query
 * @param author - author
 * @param queryId - a queryId if previously defined
 * @returns - all columns of the newly added row in the query table
 */
export async function saveCustomQuery(
  queryInput: NestedQuery,
  queryName: string,
  author: string,
  queryId?: string,
) {
  if (!((await superAdminAccessCheck()) || (await adminAccessCheck()))) {
    throw new Error("Unauthorized");
  }

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

function formatConditionsForPostgres(arr: string[]): string {
  if (arr.length === 0) return "{}";

  const escapedStrings = arr.map((str) => {
    const escaped = str.replace(/"/g, '\\"');
    return `"${escaped}"`;
  });

  return `{${escapedStrings.join(",")}}`;
}

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
      q.query_data,
      q.conditions_list
    FROM
      query q;
  `;
  // TODO: this will eventually need to take into account user permissions and specific authors
  // We'll probably also need to refactor this to not show up in any user-facing containers

  const results = await dbClient.query(query);
  const formattedData: { [key: string]: CustomUserQuery } = {};

  results.rows.forEach((row) => {
    const { query_id, query_name, query_data, conditions_list } = row;

    // Initialize query structure if it doesn't exist
    if (!formattedData[query_id]) {
      formattedData[query_id] = {
        query_id,
        query_name,
        conditions_list,
        valuesets: [],
      };
    }

    Object.entries(
      query_data as {
        [condition: string]: { [valueSetId: string]: DibbsValueSet };
      },
    ).forEach(([_, includedValueSets]) => {
      Object.entries(includedValueSets).forEach(
        ([valueSetId, valueSetData]) => {
          // Check if the valueSetId already exists in the valuesets array
          let valueset = formattedData[query_id].valuesets.find(
            (v) => v.valueSetId === valueSetId,
          );

          // If valueSetId doesn't exist, add it
          if (!valueset) {
            formattedData[query_id].valuesets.push(valueSetData);
          }
        },
      );
    });
  });

  return Object.values(formattedData);
}

/**
 * Retrieves the query list to populate the query building page.
 * This method performs role checks before retrieving the data.
 * @returns Available custom queries.
 */
export async function getQueryList(): Promise<CustomUserQuery[]> {
  if (!(await adminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  return getCustomQueries();
}
/**
 * Deletes a query from the database by its unique ID.
 * @param queryId - The unique identifier of the query to delete.
 * @returns A success or error response indicating the result.
 */
export const deleteQueryById = async (queryId: string) => {
  if (!(await adminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  const deleteQuery = `
    DELETE FROM query WHERE id = $1;
  `;
  try {
    await dbClient.query("BEGIN");
    await dbClient.query(deleteQuery, [queryId]);
    await dbClient.query("COMMIT");
    return { success: true };
  } catch (error) {
    await dbClient.query("ROLLBACK");
    console.error(`Failed to delete query with ID ${queryId}:`, error);
    return { success: false, error: "Failed to delete the query." };
  }
};
