import https from "https";
import { FhirServerConfig } from "../models/entities/fhir-servers";
import { AuthData } from "../backend/dbServices/fhir-servers";
import { createSmartJwt } from "../backend/dbServices/smartOnFhir/lib";
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
   * Creates a temporary client for testing a connection
   * @param url The FHIR server URL
   * @param disableCertValidation Whether to disable SSL validation
   * @param authData Authentication data
   * @returns A configured FHIRClient instance
   */
  private static createTestClient(
    url: string,
    disableCertValidation: boolean = false,
    authData?: AuthData,
  ): FHIRClient {
    // Create a minimal server config for testing
    const testConfig: FhirServerConfig = {
      id: "test",
      name: "test",
      hostname: url,
      disable_cert_validation: disableCertValidation,
      headers: {},
    };

    // Add auth-related properties if auth data is provided
    if (authData) {
      testConfig.auth_type = authData.authType;

      if (authData.authType === "basic" && authData.bearerToken) {
        testConfig.headers = {
          Authorization: `Bearer ${authData.bearerToken}`,
        };
      } else if (["client_credentials", "SMART"].includes(authData.authType)) {
        testConfig.client_id = authData.clientId;
        testConfig.token_endpoint = authData.tokenEndpoint;
        testConfig.scopes = authData.scopes;

        if (authData.authType === "client_credentials") {
          testConfig.client_secret = authData.clientSecret;
        }
      }
    }

    // Create a client with a configurations array containing only the test config
    const client = new FHIRClient("test", [testConfig]);
    return client;
  }

  /**
   * Tests a connection to a FHIR server
   * @param url The FHIR server URL
   * @param disableCertValidation Whether to disable SSL validation
   * @param authData Authentication data
   * @returns Result of the connection test
   */
  static async testConnection(
    url: string,
    disableCertValidation: boolean = false,
    authData?: AuthData,
  ) {
    try {
      // Create a test client
      const client = FHIRClient.createTestClient(
        url,
        disableCertValidation,
        authData,
      );

      // Try to authenticate if needed
      if (
        authData &&
        ["client_credentials", "SMART"].includes(authData.authType)
      ) {
        try {
          await client.ensureValidToken();
        } catch (error) {
          return {
            success: false,
            error: `Authentication failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
          };
        }
      }

      // Try to fetch the server's metadata
      const response = await client.get("/metadata");

      if (!response.ok) {
        return {
          success: false,
          error: `Server returned ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error testing FHIR connection:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
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
      if (!tokenEndpoint && this.serverConfig.auth_type === "SMART") {
        tokenEndpoint = await this.discoverTokenEndpoint();
      }
      if (!tokenEndpoint) {
        throw new Error("Token endpoint is required for authentication");
      }

      // Create URLSearchParams for all auth types
      const formData = new URLSearchParams();
      formData.append("grant_type", "client_credentials");
      formData.append("client_id", this.serverConfig.client_id);

      // Add scopes if available
      if (this.serverConfig.scopes) {
        formData.append("scope", this.serverConfig.scopes);
      }

      // Add JWT assertion for SMART auth type
      if (this.serverConfig.auth_type === "SMART") {
        const jwt = await createSmartJwt(
          this.serverConfig.client_id,
          tokenEndpoint,
        );

        formData.append(
          "client_assertion_type",
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        );
        formData.append("client_assertion", jwt);
      } else if (
        this.serverConfig.auth_type === "client_credentials" &&
        this.serverConfig.client_secret
      ) {
        formData.append("client_secret", this.serverConfig.client_secret);
      }

      // Prepare the request options
      const requestInit: RequestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: formData,
      };

      // If SSL validation is disabled, add the agent
      if (this.serverConfig.disable_cert_validation) {
        (requestInit as RequestInit & { agent?: https.Agent }).agent =
          new https.Agent({
            rejectUnauthorized: false,
          });
      }

      // IMPORTANT: Use the formData object for the actual request
      const response = await fetch(tokenEndpoint, requestInit);

      // Get response as text first for debugging
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`Token request failed: ${responseText}`);
      }

      // Parse the response if it's valid JSON
      let tokenData;
      try {
        tokenData = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!tokenData.access_token) {
        throw new Error(`No access token in response: ${responseText}`);
      }

      // Calculate expiry time (default to 55 minutes if expires_in not provided)
      const expiresIn = tokenData.expires_in || 3300; // 55 minutes
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn - 60); // Subtract 60s buffer
      const expiryIso = expiryDate.toISOString();

      // Update local config
      this.serverConfig.access_token = tokenData.access_token;
      this.serverConfig.token_expiry = expiryIso;

      // Update headers for requests
      if (!this.init.headers) {
        this.init.headers = {};
      }
      (this.init.headers as Record<string, string>)["Authorization"] =
        `Bearer ${tokenData.access_token}`;

      // Only update database for non-test clients
      if (this.serverConfig.id !== "test") {
        // Save token to database
        await updateFhirServer(
          this.serverConfig.id,
          this.serverConfig.name,
          this.serverConfig.hostname,
          this.serverConfig.disable_cert_validation,
          this.serverConfig.last_connection_successful,
          {
            authType: this.serverConfig.auth_type as
              | "SMART"
              | "client_credentials"
              | "basic"
              | "none",
            clientId: this.serverConfig.client_id,
            clientSecret: this.serverConfig.client_secret,
            tokenEndpoint: this.serverConfig.token_endpoint,
            scopes: this.serverConfig.scopes,
            accessToken: tokenData.access_token, // Pass the access token
            tokenExpiry: expiryIso, // Pass the token expiry
          },
        );
      }
    } catch (error) {
      console.error("Error getting access token:", error);
      throw new Error(
        `Authentication failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
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

      // Prepare the request options
      const requestInit: RequestInit = {
        method: "GET",
        headers: {},
      };

      // If SSL validation is disabled, add the agent
      if (this.serverConfig.disable_cert_validation) {
        (requestInit as RequestInit & { agent?: https.Agent }).agent =
          new https.Agent({
            rejectUnauthorized: false,
          });
      }

      const response = await fetch(wellKnownUrl, requestInit);

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
