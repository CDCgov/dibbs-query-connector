"use server";

import type {
  MedicalRecordSections,
  NestedQuery,
  QueryTableResult,
} from "@/app/(pages)/queryBuilding/utils";
import { adminRequired, transaction } from "../db/decorators";
import {
  deleteQueryByIdHelp,
  getSavedQueryByIdHelp,
  saveCustomQueryHelp,
} from "./lib";
import dbService from "../db/service";
import { getAllGroupQueries } from "../usergroup-management";
import { User } from "@/app/models/entities/users";
import { CustomUserQuery } from "@/app/models/entities/query";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { auditable } from "../audit-logs/decorator";
import { linkTimeboxRangesToQuery } from "../query-timefiltering";

class QueryBuildingService {
  /**
   * Backend handler function for upserting a query
   * @param queryInput - frontend input for a query
   * @param medicalRecordSections - sections of the medical record to include in the query
   * @param queryName - name of query
   * @param author - author
   * @param queryId - a queryId if previously defined
   * @returns - all columns of the newly added row in the query table
   */
  @adminRequired
  @auditable
  static async saveCustomQuery(
    queryInput: NestedQuery,
    medicalRecordSections: MedicalRecordSections,
    queryName: string,
    author: string,
    queryId?: string,
  ) {
    return saveCustomQueryHelp(
      queryInput,
      queryName,
      author,
      dbService,
      medicalRecordSections,
      queryId,
    );
  }

  /**
   * Getter function to grab saved query details from the DB
   * @param queryId - Query ID to grab data from the db with
   * @returns The query name, data, and conditions list from the query table
   */
  static async getSavedQueryById(queryId: string) {
    return getSavedQueryByIdHelp(queryId, dbService);
  }

  /**
   * Executes a search for a CustomQuery against the query-loaded Postgres
   * Database, using the saved name associated with the query as the unique
   * identifier by which to load the result.
   * @param name The name given to a stored query in the DB.
   * @returns One or more rows from the DB matching the requested saved query,
   * or an error if no results can be found.
   */
  static async getSavedQueryByName(name: string) {
    const values = [name];

    const getQuerybyNameSQL = `
    select q.query_name, q.id, q.query_data, q.conditions_list, q.medical_record_sections
    from query q 
    where q.query_name = $1;
  `;

    try {
      const result = await dbService.query(getQuerybyNameSQL, values);
      if (result.rows.length === 0) {
        console.error("No results found for query named:", name);
        return undefined;
      }

      const foundQuery = result.rows[0];
      const timeboxInfo = await linkTimeboxRangesToQuery(foundQuery.id);
      // followup to get timeboxing information

      foundQuery.timeboxWindows = timeboxInfo;
      return foundQuery as unknown as QueryTableResult;
    } catch (error) {
      console.error("Error retrieving query:", error);
      throw error;
    }
  }

  /**
   * Deletes a query from the database by its unique ID.
   * @param queryId - The unique identifier of the query to delete.
   * @returns A success or error response indicating the result.
   */
  @transaction
  @auditable
  static async deleteQueryById(queryId: string) {
    return deleteQueryByIdHelp(queryId, dbService);
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
   * - valuesets: An array of ValueSet objects.
   * - concepts: An array of Concept objects.
   */
  static async getCustomQueries(): Promise<CustomUserQuery[]> {
    const query = `
    SELECT
      q.id AS query_id,
      q.query_name,
      q.query_data,
      q.medical_record_sections,
      q.conditions_list
    FROM query q;
  `;

    const results = await dbService.query(query);
    const formattedData: { [key: string]: CustomUserQuery } = {};

    results.rows.forEach((row) => {
      const {
        queryId,
        queryName,
        queryData,
        medicalRecordSections,
        conditionsList,
      } = row;

      // Initialize query structure if it doesn't exist
      if (!formattedData[queryId]) {
        formattedData[queryId] = {
          queryId,
          queryName,
          medicalRecordSections,
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
    return QueryBuildingService.getCustomQueries();
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

      const { queryName, queryData, medicalRecordSections, conditionsList } =
        result.rows[0];

      const formattedQuery = {
        queryId,
        queryName,
        queryData,
        medicalRecordSections,
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
   * @param currentUser - Method to retrieve all queries assigned to groups that
   * the given user is a member of
   * @returns an array of CustomUserQuery objects
   */
  static async getQueriesForUser(currentUser: User) {
    if (!!currentUser && currentUser.userGroupMemberships) {
      const assignedQueries = await Promise.all(
        currentUser.userGroupMemberships.map(async (gm) => {
          const groupQueries = await getAllGroupQueries(gm.usergroupId);
          return groupQueries.items;
        }),
      );
      return assignedQueries.flat();
    }
  }
}

export const getSavedQueryByName = QueryBuildingService.getSavedQueryByName;
export const saveCustomQuery = QueryBuildingService.saveCustomQuery;
export const getSavedQueryById = QueryBuildingService.getSavedQueryById;
export const deleteQueryById = QueryBuildingService.deleteQueryById;
export const getCustomQueries = QueryBuildingService.getCustomQueries;
export const getQueryList = QueryBuildingService.getQueryList;
export const getQueryById = QueryBuildingService.getQueryById;
export const getQueriesForUser = QueryBuildingService.getQueriesForUser;
