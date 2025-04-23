import { Pool } from "pg";
import { getDbClient } from "../dbClient";
import { camelCaseDbColumnNames } from "./decorators";

export class DbService {
  private dbClient: Pool = getDbClient();

  @camelCaseDbColumnNames
  async query(querySql: string, values?: unknown[]) {
    return await this.dbClient.query(querySql, values);
  }
}
const dbService = new DbService();
export default dbService;
