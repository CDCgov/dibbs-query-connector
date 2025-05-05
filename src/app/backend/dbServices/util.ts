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
  token_expiry
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
