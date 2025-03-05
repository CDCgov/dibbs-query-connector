import { FhirServerConfig } from "../shared/constants";
import https from "https";
import { auditable } from "./decorators";
/**
 * A client for querying a FHIR server.
 * @param server The FHIR server to query.
 * @returns The client instance.
 */
class FHIRClient {
  private hostname: string;
  private init: RequestInit;

  constructor(server: string, configurations: FhirServerConfig[]) {
    // Find the configuration for the given server
    const config = configurations.find((c) => c.name === server);

    if (!config) {
      throw new Error(`No configuration found for server: ${server}`);
    }

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
   * Sends a GET request to the specified path.
   * @param path - The request path.
   * @returns The response from the server.
   */
  async get(path: string): Promise<Response> {
    const response = await fetch(this.hostname + path, this.init);
    return response;
  }

  /**
   * Sends multiple GET requests concurrently.
   * @param paths - Array of request paths.
   * @returns Array of responses from the server.
   */
  async getBatch(paths: string[]): Promise<Response[]> {
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
  @auditable(true)
  async post(path: string, params: Record<string, string>): Promise<Response> {
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
