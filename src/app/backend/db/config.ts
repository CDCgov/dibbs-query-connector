import { readFileSync } from "fs";
import { PoolConfig, Pool } from "pg";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cacheTimestamp = 0;

/**
 * Fetches the database password from AWS Secrets Manager, caches it in
 * process.env._DB_PASSWORD, and returns it. Uses a 5-minute TTL so that
 * password rotations are picked up without restarting the container.
 *
 * process.env is used for the cache (rather than a module-level variable)
 * because Next.js standalone builds can duplicate module-level state across
 * webpack bundle chunks, while process.env is process-global.
 *
 * Credentials are resolved via the AWS SDK default provider chain — no explicit
 * config is needed when running in ECS, where the task IAM role is picked up
 * automatically via the container metadata endpoint. The task role must have
 * `secretsmanager:GetSecretValue` permission on the secret ARN.
 *
 * @returns the database password string
 */
export async function fetchDbPassword(): Promise<string> {
  const now = Date.now();
  if (process.env._DB_PASSWORD && now - cacheTimestamp < CACHE_TTL_MS) {
    return process.env._DB_PASSWORD;
  }

  const { SecretsManagerClient, GetSecretValueCommand } =
    await import("@aws-sdk/client-secrets-manager");
  const client = new SecretsManagerClient({});
  const resp = await client.send(
    new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }),
  );

  if (!resp.SecretString) {
    throw new Error("AWS Secrets Manager returned empty SecretString");
  }

  const secret = JSON.parse(resp.SecretString);
  if (!secret.password) {
    throw new Error("Secret JSON does not contain a 'password' field");
  }

  process.env._DB_PASSWORD = secret.password;
  cacheTimestamp = now;
  return secret.password;
}

/**
 * Builds the SSL config for the pg Pool based on the DB_SSL_CA_PATH env var.
 * When set, returns an ssl object with certificate verification enabled.
 * When unset, returns undefined (no SSL).
 * @returns the ssl config object, or undefined if DB_SSL_CA_PATH is not set
 */
export function buildSslConfig():
  | { rejectUnauthorized: boolean; ca: string }
  | undefined {
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
 */
function parseDbUrl(): {
  host: string;
  port: number;
  user: string;
  database: string;
} {
  const url = new URL(process.env.DATABASE_URL!);
  return {
    host: url.hostname,
    port: Number(url.port) || 5432,
    user: decodeURIComponent(url.username),
    database: url.pathname.replace(/^\//, ""),
  };
}

/**
 * Builds the full PoolConfig at call time so that environment variables
 * are read at runtime rather than at module-initialization / bundle time.
 *
 * When DB_SECRET_ARN is set, the password is supplied as an async function
 * that fetches from Secrets Manager with a 5-minute cache. pg resolves this
 * via _checkPgPass() before SCRAM auth runs.
 */
function buildDbConfig(): PoolConfig {
  const sslConfig = buildSslConfig();
  const { host, port, user, database } = parseDbUrl();
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
    ...(process.env.DB_SECRET_ARN ? { password: () => fetchDbPassword() } : {}),
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
