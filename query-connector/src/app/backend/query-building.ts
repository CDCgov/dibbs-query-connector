"use server";

import { getDbClient } from "./dbClient";
import { QueryDetailsResult } from "../queryBuilding/utils";
const dbClient = getDbClient();

/**
 * Getter function to grab saved query details from the DB
 * @param queryId - Query ID to grab data from the db with
 * @returns The query name, data, and conditions list from the query table
 */
export async function getSavedQueryDetails(queryId: string) {
  const id = queryId;
  const queryString = `
    select q.query_name, q.id, q.query_data, q.conditions_list
        from query q 
    where q.id = $1;
    `;

  try {
    const result = await dbClient.query(queryString, [id]);
    if (result.rows.length > 0) {
      return result.rows as unknown as QueryDetailsResult[];
    }
    console.error("No results found for query:", id);
    return [];
  } catch (error) {
    console.error("Error retrieving query", error);
  }
}
