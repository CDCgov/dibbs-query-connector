import { FhirServerConfig } from "@/app/models/entities/fhir-servers";
import FHIRClient from "./fhir-client";
import dbService from "../db/service";

// Server-side access to FHIR server configurations, including stored
// credentials. Query execution, token refresh, and the REST API need this
// without a signed-in session, so it can't sit behind the gated actions in
// service.ts. This module must not be marked "use server": every export of
// such a module is a POST-able endpoint, and nothing here checks access.

let cachedFhirServerConfigs: FhirServerConfig[] | null = null;
let cacheFetchedAt = 0;
// Mutations clear the cache in-process, but other instances in a
// multi-instance deployment won't see them; the TTL bounds that staleness
const CACHE_TTL_MS = 60_000;

/**
 * Reads every FHIR server configuration straight from the database.
 * @returns An array of the FHIR server configs
 */
async function readFhirServerConfigs() {
  const query = `SELECT * FROM fhir_servers;`;
  const result = await dbService.query(query);
  return result.rows as FhirServerConfig[];
}

/**
 * Fetches the full configuration, credentials included, for every FHIR server.
 * @param forceRefresh - Whether to flush the config cache
 * @returns The configurations for all FHIR servers
 */
export async function getFhirServerConfigs(forceRefresh = false) {
  const cacheExpired = Date.now() - cacheFetchedAt > CACHE_TTL_MS;
  if (forceRefresh || cacheExpired || cachedFhirServerConfigs === null) {
    cachedFhirServerConfigs = await readFhirServerConfigs();
    cacheFetchedAt = Date.now();
  }
  return cachedFhirServerConfigs;
}

/**
 * Drops the cached configs so the next read fetches fresh data.
 */
export function clearFhirServerConfigCache() {
  cachedFhirServerConfigs = null;
}

/**
 * @returns The names of all FHIR servers, with the default server first
 */
export async function getFhirServerNames(): Promise<string[]> {
  const configs = await getFhirServerConfigs();
  // Sort a copy so that the default server is always first, without
  // mutating the cached config array
  const sortedConfigs = [...configs].sort((a, b) =>
    b.defaultServer === true ? 1 : a.defaultServer === true ? -1 : 0,
  );
  return sortedConfigs.map((config) => config.name);
}

/**
 * Persists a refreshed access token for a FHIR server. Deliberately narrow:
 * token refresh runs in the background, so it must not rewrite configuration
 * columns the way updateFhirServer does (a partial authData there would
 * silently reset fields like query_strategy and endpoint_type to their
 * defaults).
 * @param id - The ID of the FHIR server
 * @param accessToken - The new access token
 * @param tokenExpiry - ISO timestamp when the token expires
 * @returns An object indicating success or failure with optional error message
 */
export async function updateFhirServerAccessToken(
  id: string,
  accessToken: string,
  tokenExpiry: string,
) {
  const updateQuery = `
    UPDATE fhir_servers
    SET
      access_token = $2,
      token_expiry = $3
    WHERE id = $1
    RETURNING *;
  `;

  try {
    const result = await dbService.query(updateQuery, [
      id,
      accessToken,
      tokenExpiry,
    ]);

    clearFhirServerConfigCache();

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Server not found",
      };
    }

    return {
      success: true,
      server: result.rows[0],
    };
  } catch (error) {
    console.error("Failed to update FHIR server access token:", error);
    return {
      success: false,
      error: "Failed to update the server access token.",
    };
  }
}

/**
 * Builds a FHIR client for a configured server, refreshing its token first
 * when the server uses SMART auth.
 * @param serverName - The name of the configured FHIR server
 * @returns A FHIR client for the server
 */
export async function prepareFhirClient(serverName: string) {
  const configs = await readFhirServerConfigs();
  const config = configs.find((c) => c.name === serverName);

  if (!config) throw new Error(`No server config found for ${serverName}`);

  if (config.authType === "SMART") {
    const client = new FHIRClient(config);
    await client.ensureValidToken();
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${config.accessToken}`,
    };
  }

  return new FHIRClient(config);
}
