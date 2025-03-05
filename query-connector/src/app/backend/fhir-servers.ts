"use server";

import { getDbClient } from "./dbClient";
import { FhirServerConfig } from "../models/entities/fhir-servers";
import { superAdminAccessCheck } from "../utils/auth";

//Cache for FHIR server configurations
let cachedFhirServerConfigs: Promise<FhirServerConfig[]> | null = null;
const dbClient = getDbClient();

/**
 * Inserts a new FHIR server configuration into the database.
 * @param name - The name of the FHIR server
 * @param hostname - The URL/hostname of the FHIR server
 * @param disableCertValidation - Whether to disable certificate validation
 * @param lastConnectionSuccessful - Optional boolean indicating if the last connection was successful
 * @param bearerToken - Optional bearer token for authentication
 * @returns An object indicating success or failure with optional error message
 */
export async function insertFhirServer(
  name: string,
  hostname: string,
  disableCertValidation: boolean,
  lastConnectionSuccessful?: boolean,
  bearerToken?: string,
) {
  if (!(await superAdminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  const insertQuery = `
    INSERT INTO fhir_servers (
      name,
      hostname, 
      last_connection_attempt,
      last_connection_successful,
      headers,
      disable_cert_validation
    )
    VALUES ($1, $2, $3, $4, $5, $6);
  `;

  try {
    await dbClient.query("BEGIN");

    // Create headers object if bearer token is provided
    const headers = bearerToken
      ? { Authorization: `Bearer ${bearerToken}` }
      : {};

    const result = await dbClient.query(insertQuery, [
      name,
      hostname,
      new Date(),
      lastConnectionSuccessful,
      headers,
      disableCertValidation,
    ]);

    // Clear the cache so the next getFhirServerConfigs call will fetch fresh data
    cachedFhirServerConfigs = null;

    await dbClient.query("COMMIT");

    return {
      success: true,
      server: result.rows[0],
    };
  } catch (error) {
    await dbClient.query("ROLLBACK");
    console.error("Failed to insert FHIR server:", error);
    return {
      success: false,
      error: "Failed to save the FHIR server configuration.",
    };
  }
}

/**
 * Deletes a FHIR server configuration from the database.
 * @param id - The ID of the FHIR server to delete
 * @returns An object indicating success or failure with optional error message
 */
export async function deleteFhirServer(id: string) {
  if (!(await superAdminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  const deleteQuery = `
    DELETE FROM fhir_servers 
    WHERE id = $1
    RETURNING *;
  `;

  try {
    await dbClient.query("BEGIN");

    const result = await dbClient.query(deleteQuery, [id]);

    // Clear the cache so the next getFhirServerConfigs call will fetch fresh data
    cachedFhirServerConfigs = null;

    await dbClient.query("COMMIT");

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
    await dbClient.query("ROLLBACK");
    console.error("Failed to delete FHIR server:", error);
    return {
      success: false,
      error: "Failed to delete the server configuration.",
    };
  }
}

/**
 * Updates an existing FHIR server configuration in the database.
 * @param id - The ID of the FHIR server to update
 * @param name - The new name of the FHIR server
 * @param hostname - The new URL/hostname of the FHIR server
 * @param disableCertValidation - Whether to disable certificate validation
 * @param lastConnectionSuccessful - Optional boolean indicating if the last connection was successful
 * @param bearerToken - Optional bearer token for authentication
 * @returns An object indicating success or failure with optional error message
 */
export async function updateFhirServer(
  id: string,
  name: string,
  hostname: string,
  disableCertValidation: boolean,
  lastConnectionSuccessful?: boolean,
  bearerToken?: string,
) {
  if (!(await superAdminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  const updateQuery = `
      UPDATE fhir_servers 
      SET 
        name = $2,
        hostname = $3,
        last_connection_attempt = CURRENT_TIMESTAMP,
        last_connection_successful = $4,
        headers = $5,
        disable_cert_validation = $6
      WHERE id = $1
      RETURNING *;
    `;

  try {
    await dbClient.query("BEGIN");

    // If updating with a bearer token, add it to existing headers
    // If no bearer token provided, fetch existing headers and remove Authorization
    let headers = {};
    if (bearerToken) {
      // Get existing headers if any
      const existingServer = await dbClient.query(
        "SELECT headers FROM fhir_servers WHERE id = $1",
        [id],
      );
      if (existingServer.rows.length > 0) {
        // Keep existing headers and add/update Authorization
        headers = {
          ...existingServer.rows[0].headers,
          Authorization: `Bearer ${bearerToken}`,
        };
      } else {
        // No existing headers, just set Authorization
        headers = { Authorization: `Bearer ${bearerToken}` };
      }
    } else {
      // Get existing headers if any and remove Authorization
      const existingServer = await dbClient.query(
        "SELECT headers FROM fhir_servers WHERE id = $1",
        [id],
      );
      if (existingServer.rows.length > 0) {
        const existingHeaders = existingServer.rows[0].headers || {};
        // Remove Authorization if it exists when switching to no auth
        const { _, ...restHeaders } = existingHeaders;
        headers = restHeaders;
      }
    }

    const result = await dbClient.query(updateQuery, [
      id,
      name,
      hostname,
      lastConnectionSuccessful,
      headers,
      disableCertValidation,
    ]);

    // Clear the cache so the next getFhirServerConfigs call will fetch fresh data
    cachedFhirServerConfigs = null;

    await dbClient.query("COMMIT");

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
    await dbClient.query("ROLLBACK");
    console.error("Failed to update FHIR server:", error);
    return {
      success: false,
      error: "Failed to update the server configuration.",
    };
  }
}

/**
 * Updates the connection status for a FHIR server.
 * @param name - The name of the FHIR server
 * @param wasSuccessful - Whether the connection attempt was successful
 * @returns An object indicating success or failure with optional error message
 */
export async function updateFhirServerConnectionStatus(
  name: string,
  wasSuccessful: boolean,
) {
  // TODO check if I can add a super admin check here

  const updateQuery = `
      UPDATE fhir_servers 
      SET 
        last_connection_attempt = CURRENT_TIMESTAMP,
        last_connection_successful = $2
      WHERE name = $1
      RETURNING *;
    `;

  try {
    const result = await dbClient.query(updateQuery, [name, wasSuccessful]);

    // Clear the cache so the next getFhirServerConfigs call will fetch fresh data
    cachedFhirServerConfigs = null;

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
    console.error("Failed to update FHIR server connection status:", error);
    return {
      success: false,
      error: "Failed to update the server connection status.",
    };
  }
}

/**
 * Fetches the configuration for a FHIR server from the database.
 * @param fhirServerName - The name of the FHIR server to fetch the configuration for.
 * @returns The configuration for the FHIR server.
 */
export async function getFhirServerConfig(fhirServerName: string) {
  const configs = await getFhirServerConfigs();
  return configs.find((config) => config.name === fhirServerName);
}

/**
 * Fetches all FHIR server configurations from the database and caches the result.
 * @param forceRefresh - Optional param to determine if the cache should be refreshed.
 * @returns An array of FHIR server configurations.
 */
export async function getFhirServerConfigs(forceRefresh = false) {
  if (forceRefresh || !cachedFhirServerConfigs) {
    cachedFhirServerConfigs = (async () => {
      const query = `SELECT * FROM fhir_servers;`;
      const result = await dbClient.query(query);
      return result.rows;
    })();
  }
  return cachedFhirServerConfigs;
}

/**
 * Fetches all FHIR server configurations to populate FHIR Servers page.
 * This method will perform user role checks
 * @param forceRefresh - Optional param to determine if the cache should be refreshed.
 * @returns An array of FHIR server configurations.
 */
export async function getFhirServersList(forceRefresh = false) {
  if (!(await superAdminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  return getFhirServerConfigs(forceRefresh);
}

/**
 * Fetches all FHIR server names from the database to make them available for selection on the front end/client side.
 * @returns An array of FHIR server names.
 */
export async function getFhirServerNames(): Promise<string[]> {
  const configs = await getFhirServerConfigs();
  return configs.map((config) => config.name);
}
