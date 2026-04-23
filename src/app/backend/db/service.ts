import {
  dontUseOutsideConfigOrTests_getDbPool,
  isDbAuthError,
  rotateDbCredentialsOnAuthFailure,
} from "./config";
import { camelCaseDbColumnNames } from "./decorators";
import { Pool, PoolClient } from "pg";

/**
 * Runs `fn` and, if it throws a pg auth error (e.g. 28P01) while
 * DB_SECRET_ARN is set, invalidates the cached password, resets the pool,
 * and retries once with a freshly-fetched password from Secrets Manager.
 * @param fn the function to run
 * @returns the result of `fn`, possibly after one retry
 */
async function withAuthRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (process.env.DB_SECRET_ARN && isDbAuthError(err)) {
      await rotateDbCredentialsOnAuthFailure();
      return await fn();
    }
    throw err;
  }
}

export class DbClient {
  private get dbPool(): Pool {
    return dontUseOutsideConfigOrTests_getDbPool();
  }
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
    this.dbClient = await withAuthRetry(() => this.dbPool.connect());
    return;
  }
}

export class DbService {
  private get dbPool(): Pool {
    return dontUseOutsideConfigOrTests_getDbPool();
  }

  @camelCaseDbColumnNames
  async query(querySql: string, values?: unknown[]) {
    return await withAuthRetry(() => this.dbPool.query(querySql, values));
  }
}

const dbService = new DbService();
export default dbService;
