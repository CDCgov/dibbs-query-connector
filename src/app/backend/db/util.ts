export const FHIR_SERVER_INSERT_QUERY = `
INSERT INTO fhir_servers (
  name,
  hostname, 
  last_connection_attempt,
  last_connection_successful,
  headers,
  disable_cert_validation,
  default_server,
  auth_type,
  client_id,
  client_secret,
  token_endpoint,
  scopes,
  access_token,
  token_expiry,
  ca_cert,
  patient_match_configuration,
  endpoint_type,
  query_strategy
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
RETURNING *;
`;

/**
 * Function that takes Postgres default snake case strings and camel cases them
 * @param str to transform
 * @returns a camel cased string
 */
export function translateSnakeStringToCamelCase(str: string) {
  return str
    .replace(/valueset/g, "valueSet") // special case
    .replace(/_+([a-z])/g, function (_, letter) {
      return letter.toUpperCase();
    });
}

/**
 * Utility function that camel cases the keys of objects, handling nested objects
 * as well
 * @param obj - the object to format
 * @param seen - Weekset to protect against circular references
 * @returns An object whose keys are camel cased
 */
export function translateNestedObjectKeysIntoCamelCase(
  obj: object,
  seen: WeakSet<object> = new WeakSet(),
): object {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // guard against arrays
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === "object" && item !== null
        ? translateNestedObjectKeysIntoCamelCase(item, seen)
        : item,
    );
  }

  // Prevent circular references
  if (seen.has(obj)) {
    return obj;
  }
  seen.add(obj);

  const formatedObj: Record<string, unknown> = {};
  Object.entries(obj).forEach(([k, v]) => {
    let valueToSet = v;

    if (typeof v === "string") {
      try {
        const parsedObject = JSON.parse(v);
        if (parsedObject && typeof parsedObject === "object") {
          valueToSet = JSON.stringify(
            translateNestedObjectKeysIntoCamelCase(parsedObject),
          );
        }
      } catch {}
    } else if (isPlainObject(v)) {
      valueToSet = translateNestedObjectKeysIntoCamelCase(v, seen);
    }

    formatedObj[translateSnakeStringToCamelCase(k)] = valueToSet;
  });

  return formatedObj;
}

function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return (
    typeof obj === "object" &&
    obj !== null &&
    Object.getPrototypeOf(obj) === Object.prototype
  );
}

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
