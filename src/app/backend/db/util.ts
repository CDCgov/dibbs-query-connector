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
  patient_match_configuration
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
RETURNING *;
`;

/**
 * Function that takes Postgres default snake case strings and camel cases them
 * @param str to transform
 * @returns a camel cased string
 */
export function translateSnakeStringToCamelCase(str: string) {
  return str.replace(/_+([a-z])/g, function (_, letter) {
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
    console.log("in term: ", obj);
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
