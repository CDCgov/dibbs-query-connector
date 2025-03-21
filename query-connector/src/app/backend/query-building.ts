"use server";

import { getDbClient } from "./dbClient";
import { DibbsValueSet } from "../models/entities/valuesets";
import { adminAccessCheck } from "../utils/auth";
import { CustomUserQuery } from "../models/entities/query";
const dbClient = getDbClient();

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
