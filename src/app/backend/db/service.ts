import { dontUseOutsideConfigOrTests_getDbClient } from "./config";
import { camelCaseDbColumnNames } from "./decorators";
import { Pool, PoolClient } from "pg";

export class DbService {
  private dbPool: Pool = dontUseOutsideConfigOrTests_getDbClient();
  private dbClient: PoolClient | undefined;

  @camelCaseDbColumnNames
  async query(querySql: string, values?: unknown[]) {
    return this.dbClient
      ? await this.dbClient.query(querySql, values)
      : await this.dbPool.query(querySql, values);
  }

  async connect() {
    const client = await this.dbPool.connect();
    this.dbClient = client;
    return this.dbClient;
  }

  async disconnect() {
    this.dbClient?.release();
    return (this.dbClient = undefined);
  }
}

const dbService = new DbService();
export default dbService;
