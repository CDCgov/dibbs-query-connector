"use server";

import { Pool } from "pg";
import { getDbClient } from "../dbClient";
import type { NestedQuery } from "@/app/(pages)/queryBuilding/utils";
import { adminRequired, transaction } from "./decorators";
import {
  deleteQueryByIdHelp,
  getSavedQueryByIdHelp,
  saveCustomQueryHelp,
} from "./queryBuilding/lib";

class QueryBuildingService {
  private static dbClient: Pool = getDbClient();

  /**
   * Backend handler function for upserting a query
   * @param queryInput - frontend input for a query
   * @param queryName - name of query
   * @param author - author
   * @param queryId - a queryId if previously defined
   * @returns - all columns of the newly added row in the query table
   */
  @adminRequired
  static async saveCustomQuery(
    queryInput: NestedQuery,
    queryName: string,
    author: string,
    queryId?: string,
  ) {
    return saveCustomQueryHelp(
      queryInput,
      queryName,
      author,
      QueryBuildingService.dbClient,
      queryId,
    );
  }

  /**
   * Getter function to grab saved query details from the DB
   * @param queryId - Query ID to grab data from the db with
   * @returns The query name, data, and conditions list from the query table
   */
  static async getSavedQueryById(queryId: string) {
    return getSavedQueryByIdHelp(queryId, QueryBuildingService.dbClient);
  }

  /**
   * Deletes a query from the database by its unique ID.
   * @param queryId - The unique identifier of the query to delete.
   * @returns A success or error response indicating the result.
   */
  @transaction
  static async deleteQueryById(queryId: string) {
    return deleteQueryByIdHelp(queryId, QueryBuildingService.dbClient);
  }
}

export const saveCustomQuery = QueryBuildingService.saveCustomQuery;
export const getSavedQueryById = QueryBuildingService.getSavedQueryById;
export const deleteQueryById = QueryBuildingService.deleteQueryById;
