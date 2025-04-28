"use server";

import { DibbsValueSet } from "../models/entities/valuesets";
import { CustomUserQuery } from "../models/entities/query";
import { User } from "../models/entities/users";
import { getAllGroupQueries } from "./usergroup-management";
import dbService from "./dbServices/db-service";
import { adminRequired, transaction } from "./dbServices/decorators";

class QueryBuilding {
  /**
   * Fetches and structures custom user queries from the database.
   * Executes a SQL query to join query information with related valueset and concept data,
   * and then structures the result into a nested JSON format. The JSON format groups
   * valuesets and their nested concepts under each query.
   * @returns customUserQueriesArray - An array of objects where each object represents a query.
   * Each query object includes:
   * - query_id: The unique identifier for the query.
   * - query_name: The name of the query.
   * - valuesets: An array of ValueSet objects.
   * - concepts: An array of Concept objects.
   */
  static async getCustomQueries(): Promise<CustomUserQuery[]> {
    const query = `
    SELECT
      q.id AS query_id,
      q.query_name,
      q.query_data,
      q.conditions_list
    FROM query q;
  `;

    const results = await dbService.query(query);
    const formattedData: { [key: string]: CustomUserQuery } = {};

    results.rows.forEach((row) => {
      const { queryId, queryName, queryData, conditionsList } = row;

      // Initialize query structure if it doesn't exist
      if (!formattedData[queryId]) {
        formattedData[queryId] = {
          queryId,
          queryName,
          conditionsList,
          valuesets: [],
        };
      }

      Object.entries(
        queryData as {
          [condition: string]: { [valueSetId: string]: DibbsValueSet };
        },
      ).forEach(([_, includedValueSets]) => {
        Object.entries(includedValueSets).forEach(
          ([valueSetId, valueSetData]) => {
            // Check if the valueSetId already exists in the valuesets array
            let valueset = formattedData[queryId].valuesets.find(
              (v) => v.valueSetId === valueSetId,
            );

            // If valueSetId doesn't exist, add it
            if (!valueset) {
              formattedData[queryId].valuesets.push(valueSetData);
            }
          },
        );
      });
    });

    return Object.values(formattedData);
  }

  @adminRequired
  static async getQueryList(): Promise<CustomUserQuery[]> {
    return QueryBuilding.getCustomQueries();
  }

  /**
   * Retrieves a query from the database by its unique ID.
   * @param queryId - The unique identifier of the query to retrieve.
   * @returns A success or error response indicating the result.
   */
  @adminRequired
  static async getQueryById(queryId: string) {
    try {
      const getQuery = `
    SELECT * FROM query WHERE id = $1;
  `;
      const result = await dbService.query(getQuery, [queryId]);

      if (!result.rows || result.rows.length === 0) {
        console.error("No results found for query id:", queryId);
        return undefined;
      }

      const { queryName, queryData, conditionsList } = result.rows[0];

      const formattedQuery = {
        queryId,
        queryName,
        queryData,
        conditionsList,
        valuesets: [],
      };

      return formattedQuery as CustomUserQuery;
    } catch (error) {
      console.error(`Failed to retrieve query with ID ${queryId}:`, error);
      return { success: false, error: "Failed to retrieve the query." };
    }
  }

  /**
   * Deletes a query from the database by its unique ID.
   * @param queryId - The unique identifier of the query to delete.
   * @returns A success or error response indicating the result.
   */
  @adminRequired
  @transaction
  static async deleteQueryById(queryId: string) {
    const deleteQuery = `
    DELETE FROM query WHERE id = $1;
  `;
    try {
      await dbService.query(deleteQuery, [queryId]);
      return { success: true, id: queryId };
    } catch (error) {
      console.error(`Failed to delete query with ID ${queryId}:`, error);
      return { success: false, error: "Failed to delete the query." };
    }
  }

  /**
   * @param currentUser - Method to retrieve all queries assigned to groups that
   * the given user is a member of
   * @returns an array of CustomUserQuery objects
   */
  static async getQueriesForUser(currentUser: User) {
    if (!!currentUser && currentUser.userGroupMemberships) {
      const assignedQueries = await Promise.all(
        currentUser.userGroupMemberships.map(async (gm) => {
          const groupQueries = await getAllGroupQueries(gm.usergroup_id);
          return groupQueries.items;
        }),
      );
      return assignedQueries.flat();
    }
  }
}

export const getCustomQueries = QueryBuilding.getCustomQueries;
export const getQueryList = QueryBuilding.getQueryList;
export const getQueryById = QueryBuilding.getQueryById;
export const deleteQueryById = QueryBuilding.deleteQueryById;
