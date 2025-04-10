import { Pool } from "pg";
import { getDbClient } from "../dbClient";
import { camelCaseDbColumnNames } from "./decorators";

class dbService {
  private static dbClient: Pool = getDbClient();

  @camelCaseDbColumnNames
  static async query(querySql: string, values?: unknown[]) {
    return await dbService.dbClient.query(querySql, values);
  }
}

export default dbService;
