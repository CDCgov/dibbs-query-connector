"use server";

import { getDbClient } from "./dbClient";
import { NestedQuery, QueryDetailsResult } from "../queryBuilding/utils";
import { DibbsValueSet } from "../constants";
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

export async function saveCustomQuery(
  queryInput: NestedQuery,
  queryName: string,
  author: string,
) {
  const queryString = `
    insert into query
      values($1, $2, $3, $4)
      returning id, query_name
    `;
  const { queryData, conditionIds } = formatQueryDataForDatabase(queryInput);
  try {
    const dataToWrite = [queryName, queryData, conditionIds, author];
    const result = await dbClient.query(queryString, dataToWrite);
    if (result.rows.length > 0) {
      return result.rows as unknown as QueryDetailsResult[];
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
    Object.values(data).forEach((vsNameToVsGroupingMap) => {
      Object.values(vsNameToVsGroupingMap).forEach((vsGrouping) => {
        const valueSetsToSave = vsGrouping.items;
        valueSetsToSave.forEach((dibbsVs) => {
          queryData[conditionId][dibbsVs.valueSetId] = dibbsVs;
        });
      });
    });
  });

  return { queryData, conditionIds };
}
