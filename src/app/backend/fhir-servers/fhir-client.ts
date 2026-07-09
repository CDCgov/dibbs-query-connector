import { FhirServerConfig } from "../../models/entities/fhir-servers";
import { EndpointType } from "@/app/(pages)/fhirServers/page";
import { createSmartJwt } from "../smart-on-fhir";
import { fetchWithoutSSL } from "../../utils/utils";
import dbService from "../db/service";
import { AuthData, updateFhirServerAccessToken } from "./service";
import {
  getOrCreateMtlsCert,
  getOrCreateMtlsKey,
  isMtlsAvailable,
} from "../../utils/mtls-utils";
import {
  Agent,
  fetch as undiciFetch,
  RequestInit as UndiciRequestInit,
} from "undici";

/**
 * Lightweight resource each endpoint type probes during a connection test.
 * The resource differs because a Standard FHIR server, an Immunization Gateway,
 * and a fanout (/Task) server expose different entry points.
 */
const TEST_CONNECTION_PROBES: Record<EndpointType, string> = {
  standard:
    "/Patient?name=AuthenticatedServerConnectionTest&_summary=count&_count=1",
  immunization: "/Immunization?_count=1",
  fanout: "/Task/foo",
};

/**
 * Custom fetch function that supports mutual TLS
 * @param cert - The certificate content
 * @param key - The key content
 * @param ca - The CA content
 * @param disableCertValidation - Whether to disable SSL certificate validation
 * @returns A function that fetches a URL with mutual TLS
 */
function fetchWithMutualTLS(
  cert: string,
  key: string,
  ca: string,
  disableCertValidation: boolean = false,
) {
  // The Agent must be dispatched by the fetch from the same undici package.
  // Node's built-in fetch is backed by its own bundled undici, and a version
  // mismatch between the two dispatch-handler interfaces makes every request
  // fail with UND_ERR_INVALID_ARG ("invalid onRequestStart method").
  // One Agent per client also reuses pooled TLS connections across requests
  // instead of paying the mTLS handshake on each one.
  const agent = new Agent({
    connect: {
      cert: cert,
      key: key,
      ca: ca,
      rejectUnauthorized: !disableCertValidation,
    },
  });

  return async (url: string, options?: RequestInit): Promise<Response> => {
    // E2E tests stub outbound requests with an interceptor patched onto the
    // global fetch (see RUN_FETCH_INTERCEPTOR in layout.tsx), which undici's
    // fetch bypasses. Route through the global fetch there so the stubs apply;
    // the e2e "mTLS" endpoint is plain HTTP, so the dispatcher isn't needed.
    if (process.env.RUN_FETCH_INTERCEPTOR === "true") {
      return fetch(url, options);
    }
    return undiciFetch(url, {
      ...(options as UndiciRequestInit),
      dispatcher: agent,
    }) as unknown as Promise<Response>;
  };
}

/**
 * A captured outgoing FHIR request. Headers are intentionally omitted so the
 * auth/bearer token is never recorded or surfaced to the client.
 */
export type FhirRequestRecord = {
  method: string; // "GET" | "POST"
  url: string; // hostname + path (includes the query string for GET requests)
  body?: string; // form-encoded body for POST _search; undefined for GET
};

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
  private requestLog: FhirRequestRecord[] = [];

  constructor(config: FhirServerConfig) {
    this.serverConfig = config;
    this.hostname = config.hostname;

    // Set up the appropriate fetch function
    if (config.authType === "mutual-tls") {
      try {
        const cert = getOrCreateMtlsCert();
        const key = getOrCreateMtlsKey();
        const ca = config.caCert || "";
        this.fetch = fetchWithMutualTLS(
          cert,
          key,
          ca,
          config.disableCertValidation,
        );
      } catch (error) {
        console.error("Failed to set up mutual TLS:", error);
        throw new Error(
          "Mutual TLS is enabled but certificates are not available",
        );
      }
    } else {
      this.fetch = config.disableCertValidation ? fetchWithoutSSL : fetch;
    }

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
   * @param mutualTls Whether to use mutual TLS
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
      endpointType: authData?.endpointType ?? "standard",
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
      } else if (authData.authType === "mutual-tls") {
        if (!isMtlsAvailable()) {
          throw new Error("mTLS env vars not found");
        }
        testConfig.caCert = authData.caCert;
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
   * @param mutualTls Whether to use mutual TLS
   * @param authData Authentication data
   * @returns Result of the connection test
   */
  static async testConnection(
    url: string,
    disableCertValidation: boolean = false,
    authData?: AuthData,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const client = FHIRClient.createTestClient(
        url,
        disableCertValidation,
        authData,
      );

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

      // For mutual TLS, ensure the client certificate/key are available before
      // we attempt the handshake.
      if (authData?.authType === "mutual-tls" && !isMtlsAvailable()) {
        return { success: false, error: "mTLS certificates not found" };
      }

      // Probe a lightweight resource appropriate to the server's endpoint type
      // (Standard FHIR -> /Patient, Immunization Gateway -> /Immunization,
      // fanout -> /Task).
      const endpointType = authData?.endpointType ?? "standard";
      const response = await client.get(TEST_CONNECTION_PROBES[endpointType]);

      // A fanout (/Task) server returns 404 for the dummy task id, but that
      // still proves the server is reachable (and, for mTLS, that the handshake
      // succeeded). Any 2xx is a success for the other endpoint types.
      const reachable =
        response.ok || (endpointType === "fanout" && response.status === 404);

      if (reachable) {
        return { success: true };
      }

      const errorText = await response.text();
      console.error(
        `Error testing connection: ${response.status} ${errorText}`,
      );
      return {
        success: false,
        error: `Server returned ${response.status}: ${errorText}`,
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
  public async ensureValidToken(): Promise<void> {
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
  public async getAccessToken(): Promise<void> {
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

      // TLS configuration (mTLS certs / disabled cert validation) is handled
      // by this.fetch, which the constructor set up for this server's auth
      // type. fetch() has no "agent" option, so there's nothing to add here.

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

      // Only update database for non-test clients
      if (this.serverConfig.id !== "test") {
        // Save the token via the narrow token-only update. Going through
        // updateFhirServer here would rewrite the full row from a partial
        // authData, silently resetting configuration such as query_strategy
        // and endpoint_type to their defaults on every token refresh.
        await updateFhirServerAccessToken(
          this.serverConfig.id,
          tokenData.access_token,
          expiryIso,
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

      // TLS configuration (mTLS certs / disabled cert validation) is handled
      // by this.fetch, which the constructor set up for this server's auth
      // type. fetch() has no "agent" option, so there's nothing to add here.

      const response = await this.fetch(wellKnownUrl, requestInit);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch SMART configuration: ${response.status}`,
        );
      }

      const config = (await response.json()) as { token_endpoint?: string };
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
    this.requestLog.push({ method: "GET", url: this.hostname + path });
    const response = await this.fetch(this.hostname + path, this.init);
    return response;
  }

  /**
   * Returns the log of FHIR requests this client has issued via get()/post().
   * Used to surface the raw outgoing requests in the UI.
   * @returns The list of captured requests.
   */
  getRequestLog(): FhirRequestRecord[] {
    return this.requestLog;
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
  async post(path: string, params: URLSearchParams): Promise<Response> {
    await this.ensureValidToken();

    const requestOptions: RequestInit = {
      method: "POST",
      headers: {
        ...this.init.headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    };

    this.requestLog.push({
      method: "POST",
      url: this.hostname + path,
      body: params.toString(),
    });

    return this.fetch(this.hostname + path, requestOptions);
  }

  /**
   * Sends a POST request with JSON body to the specified path.
   * @param path - The request path.
   * @param body - The JSON body to send.
   * @returns The response from the server.
   */
  async postJson(path: string, body: unknown): Promise<Response> {
    await this.ensureValidToken();
    const requestOptions: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/fhir+json",
        PREFER: "return=representation",
        ...this.init.headers,
      },
      body: JSON.stringify(body),
      ...(this.init.headers as Record<string, string>),
    };
    return this.fetch(this.hostname + path, requestOptions);
  }

  /**
   * Sends a PUT request with JSON body to the specified path.
   * This is typically used for updating resources in FHIR.
   * @param path - The request path.
   * @param body - The JSON body to send.
   * @returns The response from the server.
   */
  async putJson(path: string, body: unknown): Promise<Response> {
    await this.ensureValidToken();
    const requestOptions: RequestInit = {
      method: "PUT",
      headers: {
        "Content-Type": "application/fhir+json",
        ...this.init.headers,
      },
      body: JSON.stringify(body),
    };
    return this.fetch(this.hostname + path, requestOptions);
  }

  /**
   * Checks whether a FHIR server supports $match by inspecting its metadata
   * @param url The FHIR server base URL
   * @param disableCertValidation Whether to disable cert validation
   * @param authData Optional auth and header configuration
   * @returns True if $match is supported, false otherwise
   */
  static async checkSupportsMatch(
    url: string,
    disableCertValidation: boolean = false,
    authData?: AuthData,
  ): Promise<{ supportsMatch: boolean; fhirVersion: string | null }> {
    try {
      const testConfig: FhirServerConfig = {
        id: "test",
        name: "test",
        hostname: url,
        disableCertValidation,
        defaultServer: false,
        headers: authData?.headers || {},
      };

      if (authData) {
        testConfig.authType = authData.authType;

        if (authData.authType === "basic" && authData.bearerToken) {
          testConfig.headers = {
            ...testConfig.headers,
            Authorization: `Bearer ${authData.bearerToken}`,
          };
        } else if (
          ["client_credentials", "SMART"].includes(authData.authType)
        ) {
          testConfig.clientId = authData.clientId;
          testConfig.tokenEndpoint = authData.tokenEndpoint;
          testConfig.scopes = authData.scopes;

          if (authData.authType === "client_credentials") {
            testConfig.clientSecret = authData.clientSecret;
          }
        }
      }

      const client = new FHIRClient(testConfig);
      await client.ensureValidToken();

      const response = await client.fetch(client.hostname + "/metadata", {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(authData?.headers || {}),
        },
      });
      if (!response.ok) {
        return { supportsMatch: false, fhirVersion: null };
      }

      const json = (await response.json()) as {
        rest?: Array<{
          resource?: Array<{
            type: string;
            operation?: Array<{ name?: string }>;
          }>;
          operation?: Array<{ name?: string }>;
        }>;
        fhirVersion?: string;
      };
      const fhirVersion =
        typeof json?.fhirVersion === "string" ? json.fhirVersion : null;

      const rest = json?.rest?.[0];
      // Check if the server supports $match operation in Patient resource
      const supportsMatchInResources =
        Array.isArray(rest?.resource) &&
        rest.resource.some(
          (res: { type: string; operation?: { name?: string }[] }) =>
            res.type === "Patient" &&
            Array.isArray(res.operation) &&
            res.operation.some((op) => op.name === "match"),
        );

      // Check if the server supports $match operation globally
      const supportsMatchGlobally =
        Array.isArray(rest?.operation) &&
        rest.operation.some((op: { name?: string }) => op.name === "match");

      return {
        supportsMatch: supportsMatchInResources || supportsMatchGlobally,
        fhirVersion,
      };
    } catch (err) {
      console.warn("Failed $match support check:", err);
      return { supportsMatch: false, fhirVersion: null };
    }
  }
}

export default FHIRClient;
