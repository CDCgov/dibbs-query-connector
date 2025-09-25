import { dontUseOutsideConfigOrTests_getDbPool } from "./config";
import { camelCaseDbColumnNames } from "./decorators";
import { Pool, PoolClient } from "pg";

export class DbClient {
  private dbPool: Pool = dontUseOutsideConfigOrTests_getDbPool();
  private dbClient: PoolClient | undefined;

  @camelCaseDbColumnNames
  async query(querySql: string, values?: unknown[]) {
    if (this.dbClient) {
      return await this.dbClient.query(querySql, values);
    }

    throw Error(
      "Db client not initialized. Call connect first before making queries",
    );
  }

  async disconnect() {
    this.dbClient?.release();
    return (this.dbClient = undefined);
  }

  async connect() {
    const client = await this.dbPool.connect();
    this.dbClient = client;
    return;
  }
}

export class DbService {
  private dbPool: Pool = dontUseOutsideConfigOrTests_getDbPool();

  @camelCaseDbColumnNames
  async query(querySql: string, values?: unknown[]) {
    return await this.dbPool.query(querySql, values);
  }
}

const dbService = new DbService();
export default dbService;
