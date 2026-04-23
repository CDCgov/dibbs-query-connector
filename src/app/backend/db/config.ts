import { readFileSync } from "fs";
import { PoolConfig, Pool } from "pg";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
  const cachedTs = Number(process.env._DB_PASSWORD_TS || 0);
  if (process.env._DB_PASSWORD && now - cachedTs < CACHE_TTL_MS) {
    return process.env._DB_PASSWORD;
  }

  const { SecretsManagerClient, GetSecretValueCommand } =
    await import("@aws-sdk/client-secrets-manager");
  const g = globalThis as Record<string, unknown>;
  if (!g._secretsManagerClient) {
    g._secretsManagerClient = new SecretsManagerClient({});
  }
  const client = g._secretsManagerClient as InstanceType<
    typeof SecretsManagerClient
  >;
  const resp = await client.send(
    new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }),
  );

  if (!resp.SecretString) {
    throw new Error("AWS Secrets Manager returned empty SecretString");
  }

  const secret = JSON.parse(resp.SecretString);
  if (typeof secret.password !== "string" || !secret.password) {
    throw new Error(
      "Secret JSON does not contain a valid 'password' string field",
    );
  }

  process.env._DB_PASSWORD = secret.password;
  process.env._DB_PASSWORD_TS = String(now);
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
 * Strips the password portion from a postgres connection URL. Used when
 * DB_SECRET_ARN is set so that an unencoded password in DATABASE_URL (which
 * would otherwise break `new URL()`) is discarded before parsing — we're going
 * to fetch the real password from Secrets Manager anyway.
 *
 * Handles passwords containing `@` by splitting on the LAST `@` in the
 * authority section. Assumes the password does not contain `/` (a structural
 * URL delimiter that would be ambiguous).
 * @param dbUrl the raw DATABASE_URL string
 * @returns the URL with the password portion removed
 */
function stripPasswordFromUrl(dbUrl: string): string {
  const m = dbUrl.match(/^([a-z]+:\/\/)([^/]*)(\/.*)?$/i);
  if (!m) return dbUrl;
  const [, scheme, authority, rest = ""] = m;
  const atIdx = authority.lastIndexOf("@");
  if (atIdx === -1) return dbUrl;
  const userinfo = authority.slice(0, atIdx);
  const hostport = authority.slice(atIdx + 1);
  const colonIdx = userinfo.indexOf(":");
  const user = colonIdx === -1 ? userinfo : userinfo.slice(0, colonIdx);
  return `${scheme}${user}@${hostport}${rest}`;
}

/**
 * Parses DATABASE_URL into individual pg connection fields. Using individual
 * fields (instead of connectionString) lets us supply `password` as an async
 * function for Secrets Manager rotation support.
 *
 * When DB_SECRET_ARN is set, the password portion of the URL is stripped
 * before parsing so unencoded special characters (`#`, `:`, `>`, etc.) don't
 * crash `new URL()` — the password will be fetched from Secrets Manager.
 *
 * Returns safe defaults when DATABASE_URL is not set (e.g. during next build).
 * @returns the parsed pg connection fields (host, port, user, database, password)
 */
export function parseDbUrl(): {
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
  const urlToParse = process.env.DB_SECRET_ARN
    ? stripPasswordFromUrl(dbUrl)
    : dbUrl;
  let url: URL;
  try {
    url = new URL(urlToParse);
  } catch (err) {
    throw new Error(
      `Failed to parse DATABASE_URL. If the password contains special ` +
        `characters (e.g. #, :, >, @, ?, /), percent-encode them, or set ` +
        `DB_SECRET_ARN to source the password from AWS Secrets Manager ` +
        `instead. Underlying error: ${err instanceof Error ? err.message : err}`,
    );
  }
  return {
    host: url.hostname,
    port: Number(url.port) || 5432,
    user: decodeURIComponent(url.username),
    database: url.pathname.replace(/^\//, ""),
    password: url.password ? decodeURIComponent(url.password) : undefined,
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

const AUTH_ERROR_CODES = new Set(["28P01", "28000"]);

/**
 * Returns true when `err` is a pg auth error (invalid_password /
 * invalid_authorization_specification), which typically means the cached
 * password is stale relative to a rotation that just happened upstream.
 * @param err the error thrown by pg
 * @returns true if the error indicates a DB auth failure
 */
export function isDbAuthError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" && AUTH_ERROR_CODES.has(code);
}

let rotationInFlight: Promise<void> | null = null;

/**
 * Invalidates the cached DB password and ends the current pool so that the
 * next call to `dontUseOutsideConfigOrTests_getDbPool()` creates a fresh pool
 * that fetches a newly-rotated password from Secrets Manager. Concurrent
 * callers share the same in-flight rotation — only one pool reset occurs.
 * @returns a promise that resolves once the pool has been ended
 */
export function rotateDbCredentialsOnAuthFailure(): Promise<void> {
  if (rotationInFlight) return rotationInFlight;
  console.warn(
    "DB auth failed; invalidating password cache and resetting pool",
  );
  rotationInFlight = (async () => {
    delete process.env._DB_PASSWORD;
    delete process.env._DB_PASSWORD_TS;
    const old = cachedDbClient;
    cachedDbClient = null;
    if (old) {
      try {
        await old.end();
      } catch {
        // pool may already be broken; ignore
      }
    }
  })().finally(() => {
    rotationInFlight = null;
  });
  return rotationInFlight;
}
