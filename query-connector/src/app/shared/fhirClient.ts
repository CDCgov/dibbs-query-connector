import https from "https";
import { FhirServerConfig } from "../models/entities/fhir-servers";
import { createSmartJwt } from "../utils/jwt";
import { updateFhirServer } from "../backend/dbServices/fhir-servers";

/**
 * A client for querying a FHIR server.
 * @param server The FHIR server to query.
 * @returns The client instance.
 */
class FHIRClient {
  private hostname: string;
  private init: RequestInit;
  private serverConfig: FhirServerConfig;

  constructor(server: string, configurations: FhirServerConfig[]) {
    // Find the configuration for the given server
    const config = configurations.find((c) => c.name === server);

    if (!config) {
      throw new Error(`No configuration found for server: ${server}`);
    }

    this.serverConfig = config;
    this.hostname = config.hostname;

    // Set request initialization parameters
    this.init = {
      method: "GET",
      headers: config.headers ?? {},
    };

    // Trust any configured server that has disabled SSL validation
    if (config.disable_cert_validation) {
      (this.init as RequestInit & { agent?: https.Agent }).agent =
        new https.Agent({
          rejectUnauthorized: false,
        });
    }
  }

  /**
   * Checks if the current token has expired and gets a new one if needed
   */
  private async ensureValidToken(): Promise<void> {
    // Only check for auth_type client_credentials or SMART
    if (
      !["client_credentials", "SMART"].includes(
        this.serverConfig.auth_type || "",
      )
    ) {
      return;
    }

    // Check if we have a valid token that hasn't expired
    if (
      this.serverConfig.access_token &&
      this.serverConfig.token_expiry &&
      new Date(this.serverConfig.token_expiry) > new Date()
    ) {
      // Token is still valid, ensure it's in headers
      if (!this.init.headers) {
        this.init.headers = {};
      }
      (this.init.headers as Record<string, string>)["Authorization"] =
        `Bearer ${this.serverConfig.access_token}`;
      return;
    }

    // Need to get a new token
    await this.getAccessToken();
  }

  /**
   * Gets a new access token using SMART on FHIR or client credentials flow
   * and updates the server configuration with the new token.
   * @throws Error if authentication fails.
   * @returns The new access token.
   */
  private async getAccessToken(): Promise<void> {
    try {
      if (!this.serverConfig.client_id) {
        throw new Error("Client ID is required for authentication");
      }

      // Determine the token endpoint
      let tokenEndpoint = this.serverConfig.token_endpoint;

      // If token endpoint not specified and it's SMART, try to discover it
      if (!tokenEndpoint && this.serverConfig.auth_type === "SMART") {
        tokenEndpoint = await this.discoverTokenEndpoint();
      }

      if (!tokenEndpoint) {
        throw new Error("Token endpoint is required for authentication");
      }

      // Create request payload based on auth type
      const requestPayload: Record<string, string> = {
        grant_type: "client_credentials",
      };

      // Add scopes if available
      if (this.serverConfig.scopes) {
        requestPayload.scope = this.serverConfig.scopes;
      }

      // Handle authentication based on auth type
      if (this.serverConfig.auth_type === "SMART") {
        // For SMART, use JWT authentication
        const jwt = await createSmartJwt(
          this.serverConfig.client_id,
          tokenEndpoint,
        );

        requestPayload.client_assertion_type =
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
        requestPayload.client_assertion = jwt;
      } else {
        // For client_credentials, use client_id/client_secret
        requestPayload.client_id = this.serverConfig.client_id;

        if (this.serverConfig.client_secret) {
          requestPayload.client_secret = this.serverConfig.client_secret;
        }
      }

      // Debug information
      console.log(
        "Token request payload:",
        JSON.stringify(requestPayload, null, 2),
      );

      // Send token request with JSON format
      const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      // Log the raw response for debugging
      const responseText = await response.text();
      console.log("Token response:", responseText);

      if (!response.ok) {
        throw new Error(`Token request failed: ${responseText}`);
      }

      // Parse the response
      const tokenData = JSON.parse(responseText);

      // Calculate expiry time (default to 55 minutes if expires_in not provided)
      const expiresIn = tokenData.expires_in || 3300; // 55 minutes
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn - 60); // Subtract 60s buffer

      // Update local config
      this.serverConfig.access_token = tokenData.access_token;
      this.serverConfig.token_expiry = expiryDate.toISOString();

      // Update headers for requests
      if (!this.init.headers) {
        this.init.headers = {};
      }
      (this.init.headers as Record<string, string>)["Authorization"] =
        `Bearer ${tokenData.access_token}`;

      // Save token to database
      await updateFhirServer(
        this.serverConfig.id,
        this.serverConfig.name,
        this.serverConfig.hostname,
        this.serverConfig.disable_cert_validation,
        this.serverConfig.last_connection_successful,
        {
          authType: this.serverConfig.auth_type as
            | "none"
            | "basic"
            | "client_credentials"
            | "SMART",
          clientId: this.serverConfig.client_id,
          clientSecret: this.serverConfig.client_secret,
          tokenEndpoint: this.serverConfig.token_endpoint,
          scopes: this.serverConfig.scopes,
        },
      );
    } catch (error) {
      console.error("Error getting access token:", error);
      throw new Error(
        `Authentication failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Discovers the token endpoint from the FHIR server's well-known configuration
   * @returns The discovered token endpoint.
   */
  private async discoverTokenEndpoint(): Promise<string> {
    try {
      const wellKnownUrl = `${this.hostname}/.well-known/smart-configuration`;
      const response = await fetch(wellKnownUrl, {
        method: "GET",
        headers: {},
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch SMART configuration: ${response.status}`,
        );
      }

      const config = await response.json();
      if (!config.token_endpoint) {
        throw new Error("Token endpoint not found in SMART configuration");
      }

      // Update the server config with the discovered endpoint
      this.serverConfig.token_endpoint = config.token_endpoint;

      return config.token_endpoint;
    } catch (error) {
      console.error("Error discovering token endpoint:", error);
      throw new Error("Failed to discover token endpoint");
    }
  }

  /**
   * Sends a GET request to the specified path.
   * @param path - The request path.
   * @returns The response from the server.
   */
  async get(path: string): Promise<Response> {
    await this.ensureValidToken();
    const response = await fetch(this.hostname + path, this.init);
    return response;
  }

  /**
   * Sends multiple GET requests concurrently.
   * @param paths - Array of request paths.
   * @returns Array of responses from the server.
   */
  async getBatch(paths: string[]): Promise<Response[]> {
    await this.ensureValidToken();
    return Promise.all(
      paths.map((path) => fetch(this.hostname + path, this.init)),
    );
  }

  /**
   * Sends a POST request to the specified path with the given parameters.
   * @param path - The request path.
   * @param params - The request parameters.
   * @returns The response from the server.
   */
  async post(path: string, params: Record<string, string>): Promise<Response> {
    await this.ensureValidToken();
    const searchParams = new URLSearchParams(params);

    const requestOptions: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...this.init.headers,
      },
      body: searchParams.toString(),
    };

    return fetch(this.hostname + path, requestOptions);
  }
}

export default FHIRClient;
