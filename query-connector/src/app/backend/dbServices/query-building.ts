import { Pool } from "pg";
import { getDbClient } from "../dbClient";
import { NestedQuery } from "@/app/(pages)/queryBuilding/utils";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { DEFAULT_TIME_WINDOW } from "@/app/shared/utils";
import { randomUUID } from "crypto";
import { transaction } from "./decorators";
import {
  deleteQueryByIdHelp,
  getSavedQueryByIdHelp,
  saveCustomQueryHelp,
} from "./queryBuilding/lib";

class QueryBuildingService {
  private static dbClient: Pool = getDbClient();

  // TODO: annotate and implement admin checks against these
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

  static async getSavedQueryById(queryId: string) {
    return getSavedQueryByIdHelp(queryId, QueryBuildingService.dbClient);
  }

  @transaction
  static async deleteQueryById(queryId: string) {
    return deleteQueryByIdHelp(queryId, QueryBuildingService.dbClient);
  }
}

export const saveCustomQuery = QueryBuildingService.saveCustomQuery;
export const getSavedQueryById = QueryBuildingService.getSavedQueryById;
export const deleteQueryById = QueryBuildingService.deleteQueryById;
