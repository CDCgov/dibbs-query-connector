import { readFileSync } from "fs";
import { PoolConfig, Pool } from "pg";

let cachedPassword: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Lazily initialized — reused across all fetchDbPassword calls to avoid
// re-running credential resolution (ECS metadata HTTP call) on every cache miss.
let secretsManagerClient:
  | import("@aws-sdk/client-secrets-manager").SecretsManagerClient
  | null = null;

/**
 * Fetches the database password from AWS Secrets Manager, with a 5-minute cache.
 * Used as the `password` option in pg Pool when DB_SECRET_ARN is set.
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
  if (cachedPassword && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedPassword;
  }

  const { SecretsManagerClient, GetSecretValueCommand } =
    await import("@aws-sdk/client-secrets-manager");
  if (!secretsManagerClient) {
    secretsManagerClient = new SecretsManagerClient({});
  }
  const resp = await secretsManagerClient.send(
    new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }),
  );

  if (!resp.SecretString) {
    throw new Error("AWS Secrets Manager returned empty SecretString");
  }

  const secret = JSON.parse(resp.SecretString);
  if (!secret.password) {
    throw new Error("Secret JSON does not contain a 'password' field");
  }

  cachedPassword = secret.password;
  cacheTimestamp = now;
  return cachedPassword as string;
}

/**
 * Resets the internal password cache. Exported only for testing.
 */
export function _resetCacheForTesting(): void {
  cachedPassword = null;
  cacheTimestamp = 0;
  secretsManagerClient = null;
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
  return { rejectUnauthorized: true, ca: readFileSync(caPath, "utf8") };
}

// Load environment variables from .env and establish a Pool configuration
const sslConfig = buildSslConfig();
const dbConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum # of connections in the pool
  idleTimeoutMillis: 30000, // A client must sit idle this long before being released
  connectionTimeoutMillis: process.env.LOCAL_DB_CLIENT_TIMEOUT
    ? Number(process.env.LOCAL_DB_CLIENT_TIMEOUT)
    : 3000, // Wait this long before timing out when connecting new client
  ...(process.env.DB_SECRET_ARN ? { password: fetchDbPassword } : {}),
  ...(sslConfig ? { ssl: sslConfig } : {}),
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
