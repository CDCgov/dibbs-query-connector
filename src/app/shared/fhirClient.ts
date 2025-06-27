import https from "https";
import { FhirServerConfig } from "../models/entities/fhir-servers";
import { createSmartJwt } from "../backend/smart-on-fhir";
import { fetchWithoutSSL } from "./utils";
import dbService from "../backend/db/service";
import { AuthData, updateFhirServer } from "../backend/fhir-servers";
/**
 * A client for querying a FHIR server.
 * @param server The FHIR server to query.
 * @returns The client instance.
 */
class FHIRClient {
  private hostname: string;
  private init: RequestInit;
  private serverConfig: FhirServerConfig;
  private fetch: (url: string, options?: RequestInit) => Promise<Response>;

  constructor(config: FhirServerConfig) {
    this.serverConfig = config;
    this.hostname = config.hostname;

    // Set up the appropriate fetch function
    this.fetch = config.disableCertValidation ? fetchWithoutSSL : fetch;

    // Set request initialization parameters
    this.init = {
      method: "GET",
      headers: config.headers ?? {},
    };
  }

  static async refreshFhirServerConfig() {
    dbService.query;
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
      disableCertValidation: disableCertValidation,
      defaultServer: false,
      headers: authData?.headers || {},
    };

    // Add auth-related properties if auth data is provided
    if (authData) {
      testConfig.authType = authData.authType;

      if (authData.authType === "basic" && authData.bearerToken) {
        // Preserve existing headers while adding Authorization
        testConfig.headers = {
          ...testConfig.headers,
          Authorization: `Bearer ${authData.bearerToken}`,
        };
      } else if (["client_credentials", "SMART"].includes(authData.authType)) {
        testConfig.clientId = authData.clientId;
        testConfig.tokenEndpoint = authData.tokenEndpoint;
        testConfig.scopes = authData.scopes;

        if (authData.authType === "client_credentials") {
          testConfig.clientSecret = authData.clientSecret;
        }
      }
    }

    // Create a client with a configurations array containing only the test config
    const client = new FHIRClient(testConfig);
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
      const response = await client.get(
        "/Patient?name=AuthenticatedServerConnectionTest&_summary=count&_count=1",
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error testing connection: ${errorText}`);
        return {
          success: false,
          error: `Server returned ${response.status}: ${errorText}`,
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
        this.serverConfig.authType || "",
      )
    ) {
      return;
    }

    // Check if we have a valid token that hasn't expired
    if (
      this.serverConfig.accessToken &&
      this.serverConfig.tokenExpiry &&
      new Date(this.serverConfig.tokenExpiry) > new Date()
    ) {
      // Token is still valid, ensure it's in headers
      if (!this.init.headers) {
        this.init.headers = {};
      }
      (this.init.headers as Record<string, string>)["Authorization"] =
        `Bearer ${this.serverConfig.accessToken}`;
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
      if (!this.serverConfig.clientId) {
        throw new Error("Client ID is required for authentication");
      }

      // Determine the token endpoint
      let tokenEndpoint = this.serverConfig.tokenEndpoint;
      if (!tokenEndpoint && this.serverConfig.authType === "SMART") {
        tokenEndpoint = await this.discoverTokenEndpoint();
      }
      if (!tokenEndpoint) {
        throw new Error("Token endpoint is required for authentication");
      }

      // Create URLSearchParams for all auth types
      const formData = new URLSearchParams();
      formData.append("grant_type", "client_credentials");
      formData.append("client_id", this.serverConfig.clientId);

      // Add Aidbox scopes if none are defined
      if (this.serverConfig.name == "Aidbox" && !this.serverConfig.scopes) {
        this.serverConfig.scopes = "system/*.read";
      }

      // Add scopes if available
      if (this.serverConfig.scopes) {
        formData.append("scope", this.serverConfig.scopes);
      }

      // Add JWT assertion for SMART auth type
      if (this.serverConfig.authType === "SMART") {
        const jwt = await createSmartJwt(
          this.serverConfig.clientId,
          tokenEndpoint,
        );

        formData.append(
          "client_assertion_type",
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        );
        formData.append("client_assertion", jwt);
      } else if (
        this.serverConfig.authType === "client_credentials" &&
        this.serverConfig.clientSecret
      ) {
        formData.append("client_secret", this.serverConfig.clientSecret);
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
      if (this.serverConfig.disableCertValidation) {
        (requestInit as RequestInit & { agent?: https.Agent }).agent =
          new https.Agent({
            rejectUnauthorized: false,
          });
      }

      // IMPORTANT: Use the formData object for the actual request
      const response = await this.fetch(tokenEndpoint, requestInit);
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
      this.serverConfig.accessToken = tokenData.access_token;
      this.serverConfig.tokenExpiry = expiryIso;

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
          this.serverConfig.disableCertValidation,
          this.serverConfig.defaultServer,
          this.serverConfig.lastConnectionSuccessful,
          {
            authType: this.serverConfig.authType as
              | "SMART"
              | "client_credentials"
              | "basic"
              | "none",
            clientId: this.serverConfig.clientId,
            clientSecret: this.serverConfig.clientSecret,
            tokenEndpoint: this.serverConfig.tokenEndpoint,
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
      if (this.serverConfig.disableCertValidation) {
        (requestInit as RequestInit & { agent?: https.Agent }).agent =
          new https.Agent({
            rejectUnauthorized: false,
          });
      }

      const response = await this.fetch(wellKnownUrl, requestInit);

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
      this.serverConfig.tokenEndpoint = config.token_endpoint;

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
    const response = await this.fetch(this.hostname + path, this.init);
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
      paths.map((path) => this.fetch(this.hostname + path, this.init)),
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

    return this.fetch(this.hostname + path, requestOptions);
  }
}

export default FHIRClient;
