"use server";

import { getDbClient } from "../database-service";
import { QueryDetailsResult } from "../queryBuilding/utils";
const dbClient = await getDbClient();

export async function getSelectedQueryDetails(queryId: string) {
  const id = queryId;
  const queryString = `
    select q.query_name, q.id, q.query_data, q.conditions_list
        from query q 
    where q.id = $1;
    `;

  try {
    const result = await dbClient.query(queryString, [id]);
    if (result.rows.length > 0) {
      return result.rows[0] as unknown as QueryDetailsResult;
    }
    console.error("No results found for query:", id);
    return [];
  } catch (error) {
    console.error("Error retrieving query", error);
  }
}
