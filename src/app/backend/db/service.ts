import { internal_getDbClient } from "./config";
import { camelCaseDbColumnNames } from "./decorators";
import { Pool } from "pg";

export class DbService {
  private dbClient: Pool = internal_getDbClient();

  @camelCaseDbColumnNames
  async query(querySql: string, values?: unknown[]) {
    return await this.dbClient.query(querySql, values);
  }
}

const dbService = new DbService();
export default dbService;
