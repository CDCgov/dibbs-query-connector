import { PoolConfig, Pool } from "pg";

// Load environment variables from .env and establish a Pool configuration
const dbConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum # of connections in the pool
  idleTimeoutMillis: 30000, // A client must sit idle this long before being released
  connectionTimeoutMillis: process.env.LOCAL_DB_CLIENT_TIMEOUT
    ? Number(process.env.LOCAL_DB_CLIENT_TIMEOUT)
    : 3000, // Wait this long before timing out when connecting new client
};

let cachedDbClient: Pool | null = null;

//
/**
 * Getter function for a DB pool from a naive cache. Creates a new one
 * if one doesn't exist
 * ! This client export is meant to be consumed only by the one in service.ts,
 * ! except for in tests because of some config issues. If you're using it in
 * ! application code, use the dbService in service.ts instead! That'll give you access
 * ! to the transaction and audibility decorators that won't work otherwise
 * @returns a cached version of the DB client
 */
export const dontUseOutsideConfigOrTests_getDbPool = () => {
  if (!cachedDbClient) {
    cachedDbClient = new Pool(dbConfig);
  }
  return cachedDbClient;
};
