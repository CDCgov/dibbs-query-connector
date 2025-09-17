import { dontUseOutsideConfigOrTests_getDbClient } from "./config";
import { camelCaseDbColumnNames } from "./decorators";
import { Pool } from "pg";

export class DbService {
  private dbClient: Pool = dontUseOutsideConfigOrTests_getDbClient();

  @camelCaseDbColumnNames
  async query(querySql: string, values?: unknown[]) {
    return await this.dbClient.query(querySql, values);
  }

  async connect() {
    const client = await this.dbClient.connect();
    return client;
  }
}
const dbService = new DbService();
export default dbService;
