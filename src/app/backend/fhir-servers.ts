"use server";
import { FhirServerConfig } from "@/app/models/entities/fhir-servers";
import { auditable } from "@/app/backend/audit-logs/decorator";
import FHIRClient from "@/app/shared/fhirClient";
import dbService from "./db/service";
import { superAdminRequired, transaction } from "./db/decorators";
import { FHIR_SERVER_INSERT_QUERY } from "./db/util";

// Define an interface for authentication data
export interface AuthData {
  authType: "none" | "basic" | "client_credentials" | "SMART";
  bearerToken?: string;
  clientId?: string;
  clientSecret?: string;
  tokenEndpoint?: string;
  scopes?: string;
  accessToken?: string;
  tokenExpiry?: string;
  headers?: Record<string, string>;
}

// Define an interface for patient match configuration
export interface PatientMatchData {
  enabled: boolean;
  onlySingleMatch: boolean;
  onlyCertainMatches: boolean;
  matchCount: number;
  supportsMatch: boolean;
}

class FhirServerConfigServiceInternal {
  /**
   * Internal implementation class that performs the underlying database read
   * to the FHIR server table. This is extended by the external facade (which
   * adds permissions checks) so that internal service code can call this method
   * without permissions, which is required for any external code.
   * @returns An array of the FHIR server configs
   */
  protected static async getFhirServerConfigs() {
    const query = `SELECT * FROM fhir_servers;`;
    const result = await dbService.query(query);
    return result.rows as FhirServerConfig[];
  }
}

class FhirServerConfigService extends FhirServerConfigServiceInternal {
  private static cachedFhirServerConfigs: FhirServerConfig[] | null = null;

  /**
   * Fetches the configuration for a FHIR server from the database.
   * @param forceRefresh - Whether to flush the config cache
   * @returns The configuration for the FHIR server.
   */
  @superAdminRequired
  static async getFhirServerConfigs(forceRefresh = false) {
    if (
      forceRefresh ||
      FhirServerConfigService.cachedFhirServerConfigs === null
    ) {
      const newServerConfigs = await super.getFhirServerConfigs();
      FhirServerConfigService.cachedFhirServerConfigs = newServerConfigs;
    }
    return FhirServerConfigService.cachedFhirServerConfigs;
  }

  static async getFhirServerNames(): Promise<string[]> {
    const configs = await super.getFhirServerConfigs();
    // Sort so that the default server is always first
    configs.sort((a, b) =>
      b.defaultServer === true ? 1 : a.defaultServer === true ? -1 : 0,
    );
    return configs.map((config) => config.name);
  }

  /**
   * Updates the connection status for a FHIR server.
   * @param name - The name of the FHIR server
   * @param wasSuccessful - Whether the connection attempt was successful
   * @returns An object indicating success or failure with optional error message
   */
  @transaction
  static async updateFhirServerConnectionStatus(
    name: string,
    wasSuccessful: boolean,
  ) {
    const updateQuery = `
    UPDATE fhir_servers 
    SET 
      last_connection_attempt = CURRENT_TIMESTAMP,
      last_connection_successful = $2
    WHERE name = $1
    RETURNING *;
  `;

    try {
      const result = await dbService.query(updateQuery, [name, wasSuccessful]);

      // Clear the cache so the next getFhirServerConfigs call will fetch fresh data
      FhirServerConfigService.cachedFhirServerConfigs = null;

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
   * Updates an existing FHIR server configuration in the database.
   * @param id - The ID of the FHIR server to update
   * @param name - The new name of the FHIR server
   * @param hostname - The new URL/hostname of the FHIR server
   * @param disableCertValidation - Whether to disable certificate validation
   * @param defaultServer - Whether this is the default server
   * @param lastConnectionSuccessful - Optional boolean indicating if the last connection was successful
   * @param authData - Authentication data including auth type and credentials
   * @param patientMatchConfiguration - Optional patient match configuration
   * @returns An object indicating success or failure with optional error message
   */
  @transaction
  @auditable
  static async updateFhirServer(
    id: string,
    name: string,
    hostname: string,
    disableCertValidation: boolean,
    defaultServer: boolean,
    lastConnectionSuccessful?: boolean,
    authData?: AuthData,
    patientMatchConfiguration?: PatientMatchData,
  ) {
    const updateQuery = `
    UPDATE fhir_servers 
    SET 
      name = $2,
      hostname = $3,
      last_connection_attempt = CURRENT_TIMESTAMP,
      last_connection_successful = $4,
      headers = $5,
      disable_cert_validation = $6,
      default_server = $7,
      auth_type = $8,
      client_id = $9,
      client_secret = $10,
      token_endpoint = $11,
      scopes = $12,
      access_token = $13,
      token_expiry = $14,
      patient_match_configuration = $15
    WHERE id = $1
    RETURNING *;
  `;

    try {
      // Default auth type to none if not provided
      const authType = authData?.authType || "none";

      // Start with custom headers from authData
      let headers = { ...(authData?.headers || {}) };

      // Remove Authorization header from custom headers if it exists
      // (Authorization should only be set via auth methods)
      if ("Authorization" in headers) {
        // eslint-disable-next-line unused-imports/no-unused-vars
        const { Authorization, ...restHeaders } = headers;
        headers = restHeaders;
      }

      // Add Authorization header for basic auth type
      if (authType === "basic" && authData?.bearerToken) {
        headers = {
          ...headers,
          Authorization: `Bearer ${authData.bearerToken}`,
        };
      }

      // Patient match configuration defaults
      const patientMatchConfigObject =
        patientMatchConfiguration != null
          ? {
              enabled: patientMatchConfiguration.enabled ?? false,
              only_single_match:
                patientMatchConfiguration.onlySingleMatch ?? false,
              only_certain_matches:
                patientMatchConfiguration.onlyCertainMatches ?? false,
              match_count: patientMatchConfiguration.matchCount ?? 1,
              supports_match: patientMatchConfiguration.supportsMatch ?? false,
            }
          : null;

      const result = await dbService.query(updateQuery, [
        id,
        name,
        hostname,
        lastConnectionSuccessful,
        headers,
        disableCertValidation,
        defaultServer,
        authType,
        authData?.clientId || null,
        authData?.clientSecret || null,
        authData?.tokenEndpoint || null,
        authData?.scopes || null,
        authData?.accessToken || null,
        authData?.tokenExpiry || null,
        patientMatchConfigObject,
      ]);

      // Clear the cache so the next getFhirServerConfigs call will fetch fresh data
      FhirServerConfigService.cachedFhirServerConfigs = null;

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
      console.error("Failed to update FHIR server:", error);
      return {
        success: false,
        error: "Failed to update the server configuration.",
      };
    }
  }

  /**
   * Inserts a new FHIR server configuration into the database.
   * @param name - The name of the FHIR server
   * @param hostname - The URL/hostname of the FHIR server
   * @param disableCertValidation - Whether to disable certificate validation
   * @param defaultServer - Whether this is the default server
   * @param lastConnectionSuccessful - Optional boolean indicating if the last connection was successful
   * @param authData - Authentication data including auth type and credentials
   * @param patientMatchConfiguration - Optional patient match configuration
   * @returns An object indicating success or failure with optional error message
   */

  @transaction
  @auditable
  static async insertFhirServer(
    name: string,
    hostname: string,
    disableCertValidation: boolean,
    defaultServer: boolean,
    lastConnectionSuccessful?: boolean,
    authData?: AuthData,
    patientMatchConfiguration?: PatientMatchData,
  ) {
    try {
      // Default auth type to none if not provided
      const authType = authData?.authType || "none";

      // Start with custom headers from authData
      let headers = { ...(authData?.headers || {}) };

      // Remove Authorization header from custom headers if it exists
      // (Authorization should only be set via auth methods)
      if ("Authorization" in headers) {
        const { _Authorization, ...restHeaders } = headers;
        headers = restHeaders;
      }

      // Add Authorization header for basic auth type
      if (authType === "basic" && authData?.bearerToken) {
        headers = {
          ...headers,
          Authorization: `Bearer ${authData.bearerToken}`,
        };
      }

      // Patient match configuration defaults
      const patientMatchConfigObject =
        patientMatchConfiguration != null
          ? {
              enabled: patientMatchConfiguration.enabled ?? false,
              only_single_match:
                patientMatchConfiguration.onlySingleMatch ?? false,
              only_certain_matches:
                patientMatchConfiguration.onlyCertainMatches ?? false,
              match_count: patientMatchConfiguration.matchCount ?? 1,
              supports_match: patientMatchConfiguration.supportsMatch ?? false,
            }
          : null;

      const result = await dbService.query(FHIR_SERVER_INSERT_QUERY, [
        name,
        hostname,
        new Date(),
        lastConnectionSuccessful,
        headers,
        disableCertValidation,
        defaultServer,
        authType,
        authData?.clientId || null,
        authData?.clientSecret || null,
        authData?.tokenEndpoint || null,
        authData?.scopes || null,
        authData?.accessToken || null,
        authData?.tokenExpiry || null,
        patientMatchConfigObject,
      ]);

      // Clear the cache so the next getFhirServerConfigs call will fetch fresh data
      FhirServerConfigService.cachedFhirServerConfigs = null;

      return {
        success: true,
        server: result.rows[0],
      };
    } catch (error) {
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
  @transaction
  @auditable
  static async deleteFhirServer(id: string) {
    const deleteQuery = `
    DELETE FROM fhir_servers 
    WHERE id = $1
    RETURNING *;
  `;

    try {
      const result = await dbService.query(deleteQuery, [id]);

      // Clear the cache so the next getFhirServerConfigs call will fetch fresh data
      FhirServerConfigService.cachedFhirServerConfigs = null;

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
      console.error("Failed to delete FHIR server:", error);
      return {
        success: false,
        error: "Failed to delete the server configuration.",
      };
    }
  }

  static async prepareFhirClient(serverName: string) {
    if (FhirServerConfigService.cachedFhirServerConfigs === null) {
      FhirServerConfigService.cachedFhirServerConfigs =
        await super.getFhirServerConfigs();
    }

    let config = FhirServerConfigService.cachedFhirServerConfigs.find(
      (c) => c.name === serverName,
    );

    if (!config) {
      // fallback retry in case we have a cache miss
      FhirServerConfigService.cachedFhirServerConfigs =
        await super.getFhirServerConfigs();
      const followupConfig =
        FhirServerConfigService.cachedFhirServerConfigs.find(
          (c) => c.name === serverName,
        );

      if (!followupConfig)
        throw Error(`No server config found for ${serverName}`);
      else {
        config = followupConfig;
      }
    }

    return new FHIRClient(config);
  }
}

export const getFhirServerConfigs =
  FhirServerConfigService.getFhirServerConfigs;
export const getFhirServerNames = FhirServerConfigService.getFhirServerNames;
export const updateFhirServerConnectionStatus =
  FhirServerConfigService.updateFhirServerConnectionStatus;
export const updateFhirServer = FhirServerConfigService.updateFhirServer;
export const insertFhirServer = FhirServerConfigService.insertFhirServer;
export const deleteFhirServer = FhirServerConfigService.deleteFhirServer;
export const prepareFhirClient = FhirServerConfigService.prepareFhirClient;
