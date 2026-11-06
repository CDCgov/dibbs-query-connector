import { readFileSync } from "fs";
import { PoolConfig, Pool } from "pg";
import { fetchDbPassword } from "./util";

/**
 * Builds the SSL config for the pg Pool based on the DB_SSL_CA_PATH env var.
 * When set, returns an ssl object with certificate verification enabled.
 * When unset, returns undefined (no SSL).
 * @returns the ssl config object, or undefined if DB_SSL_CA_PATH is not set
 */
export function buildSslConfig():
  { rejectUnauthorized: boolean; ca: string } | undefined {
  const caPath = process.env.DB_SSL_CA_PATH;
  if (!caPath) return undefined;
  try {
    return { rejectUnauthorized: true, ca: readFileSync(caPath, "utf8") };
  } catch (err) {
    throw new Error(
      `Failed to read SSL CA certificate from DB_SSL_CA_PATH="${caPath}": ${err instanceof Error ? err.message : err}`,
    );
  }
}

/**
 * Parses DATABASE_URL into individual pg connection fields. Using individual
 * fields (instead of connectionString) lets us supply `password` as an async
 * function for Secrets Manager rotation support.
 *
 * Returns safe defaults when DATABASE_URL is not set (e.g. during next build).
 * @returns
 */
function parseDbUrl(): {
  host: string;
  port: number;
  user: string;
  database: string;
  password: string | undefined;
} {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return {
        host: "localhost",
        port: 5432,
        user: "",
        database: "",
        password: undefined,
      };
    }
    throw new Error(
      "DATABASE_URL is not set. The database connection cannot be configured without it.",
    );
  }
  const url = new URL(dbUrl);
  return {
    host: url.hostname,
    port: Number(url.port) || 5432,
    user: decodeURIComponent(url.username),
    database: url.pathname.replace(/^\//, ""),
    password: url.password ? decodeURIComponent(url.password) : undefined,
  };
}
/**
 *
 * Builds the full PoolConfig at call time so that environment variables
 * are read at runtime rather than at module-initialization / bundle time.
 *
 * When DB_SECRET_ARN is set, the password is supplied as an async function
 * that fetches from Secrets Manager with a 5-minute cache. pg resolves this
 * via _checkPgPass() before SCRAM auth runs.
 *
 * @returns a PoolConfig to be consumed by the client construction
 */
function buildDbConfig(): PoolConfig {
  const sslConfig = buildSslConfig();
  const { host, port, user, database, password } = parseDbUrl();
  return {
    host,
    port,
    user,
    database,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: process.env.LOCAL_DB_CLIENT_TIMEOUT
      ? Number(process.env.LOCAL_DB_CLIENT_TIMEOUT)
      : 3000,
    ...(process.env.DB_SECRET_ARN
      ? { password: () => fetchDbPassword() }
      : password
        ? { password }
        : {}),
    ...(sslConfig ? { ssl: sslConfig } : {}),
  };
}

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
    cachedDbClient = new Pool(buildDbConfig());
  }
  return cachedDbClient;
};
