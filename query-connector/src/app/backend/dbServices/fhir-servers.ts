"use server";
import { Pool } from "pg";
import { getDbClient } from "../dbClient";
import { transaction } from "./decorators";
import { FhirServerConfig } from "@/app/models/entities/fhir-servers";
import { superAdminAccessCheck } from "@/app/utils/auth";
import { auditable } from "@/app/backend/auditLogs/decorator";

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

class FhirServerConfigService {
  private static dbClient: Pool = getDbClient();
  private static cachedFhirServerConfigs: FhirServerConfig[] | null = null;

  /**
   * Fetches the configuration for a FHIR server from the database.
   * @param checkAdminPermissions - Whether to bypass the admin check. Set to
   * false for internal service code where fetched configs won't be displayed
   * to the end user
   * @param forceRefresh - Whether to flush the config cache
   * @returns The configuration for the FHIR server.
   */
  static async getFhirServerConfigs(
    checkAdminPermissions = true,
    forceRefresh = false,
  ) {
    if (checkAdminPermissions && !(await superAdminAccessCheck())) {
      throw new Error("Unauthorized");
    }

    if (
      forceRefresh ||
      FhirServerConfigService.cachedFhirServerConfigs === null
    ) {
      const query = `SELECT * FROM fhir_servers;`;
      const result = await FhirServerConfigService.dbClient.query(query);
      const newServerConfigs = result.rows as FhirServerConfig[];
      FhirServerConfigService.cachedFhirServerConfigs = newServerConfigs;
    }
    return FhirServerConfigService.cachedFhirServerConfigs;
  }

  static async getFhirServerNames(): Promise<string[]> {
    const configs = await getFhirServerConfigs(false);
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
      const result = await FhirServerConfigService.dbClient.query(updateQuery, [
        name,
        wasSuccessful,
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
   * @param lastConnectionSuccessful - Optional boolean indicating if the last connection was successful
   * @param authData - Authentication data including auth type and credentials
   * @returns An object indicating success or failure with optional error message
   */
  @transaction
  @auditable
  static async updateFhirServer(
    id: string,
    name: string,
    hostname: string,
    disableCertValidation: boolean,
    lastConnectionSuccessful?: boolean,
    authData?: AuthData,
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
      auth_type = $7,
      client_id = $8,
      client_secret = $9,
      token_endpoint = $10,
      scopes = $11,
      access_token = $12,
      token_expiry = $13
    WHERE id = $1
    RETURNING *;
  `;

    try {
      // Default auth type to none if not provided
      const authType = authData?.authType || "none";

      // Prepare headers
      let headers = {};

      // Get existing headers if any
      const existingServer = await FhirServerConfigService.dbClient.query(
        "SELECT headers FROM fhir_servers WHERE id = $1",
        [id],
      );

      if (existingServer.rows.length > 0 && existingServer.rows[0].headers) {
        headers = { ...existingServer.rows[0].headers };

        // Remove Authorization header if it exists
        if ("Authorization" in headers) {
          const { Authorization, ...restHeaders } = headers;
          headers = restHeaders;
        }
      }

      // Add Authorization header for basic auth type
      if (authType === "basic" && authData?.bearerToken) {
        headers = {
          ...headers,
          Authorization: `Bearer ${authData.bearerToken}`,
        };
      }

      const result = await FhirServerConfigService.dbClient.query(updateQuery, [
        id,
        name,
        hostname,
        lastConnectionSuccessful,
        headers,
        disableCertValidation,
        authType,
        authData?.clientId || null,
        authData?.clientSecret || null,
        authData?.tokenEndpoint || null,
        authData?.scopes || null,
        authData?.accessToken || null,
        authData?.tokenExpiry || null,
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
   * @param lastConnectionSuccessful - Optional boolean indicating if the last connection was successful
   * @param authData - Authentication data including auth type and credentials
   * @returns An object indicating success or failure with optional error message
   */

  @transaction
  @auditable
  static async insertFhirServer(
    name: string,
    hostname: string,
    disableCertValidation: boolean,
    lastConnectionSuccessful?: boolean,
    authData?: AuthData,
  ) {
    const insertQuery = `
    INSERT INTO fhir_servers (
      name,
      hostname, 
      last_connection_attempt,
      last_connection_successful,
      headers,
      disable_cert_validation,
      auth_type,
      client_id,
      client_secret,
      token_endpoint,
      scopes,
      access_token,
      token_expiry
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *;
  `;

    try {
      // Default auth type to none if not provided
      const authType = authData?.authType || "none";

      // Prepare headers based on auth type
      let headers = {};

      // Add Authorization header for basic auth type
      if (authType === "basic" && authData?.bearerToken) {
        headers = {
          Authorization: `Bearer ${authData.bearerToken}`,
        };
      }

      const result = await FhirServerConfigService.dbClient.query(insertQuery, [
        name,
        hostname,
        new Date(),
        lastConnectionSuccessful,
        headers,
        disableCertValidation,
        authType,
        authData?.clientId || null,
        authData?.clientSecret || null,
        authData?.tokenEndpoint || null,
        authData?.scopes || null,
        authData?.accessToken || null,
        authData?.tokenExpiry || null,
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
      const result = await FhirServerConfigService.dbClient.query(deleteQuery, [
        id,
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
      console.error("Failed to delete FHIR server:", error);
      return {
        success: false,
        error: "Failed to delete the server configuration.",
      };
    }
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
