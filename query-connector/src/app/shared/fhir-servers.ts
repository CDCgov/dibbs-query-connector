import fetch, { RequestInit, HeaderInit, Response } from "node-fetch";
import { FhirServerConfig } from "../shared/constants";
import https from "https";

/**
 * A client for querying a FHIR server
 * @param server The FHIR server to query
 * @returns The client
 */
class FHIRClient {
  private hostname: string;
  private init;

  constructor(server: string, configurations: FhirServerConfig[]) {
    // Get the configuration for the server if it exists
    let config: FhirServerConfig | undefined = configurations.find(
      (config) => config.name === server,
    );

    if (!config) {
      throw new Error(`No configuration found for server: ${server}`);
    }
    // Set server hostname
    this.hostname = config.hostname;
    // Set request init, including headers
    let init: RequestInit = {
      method: "GET",
      headers: config.headers as HeaderInit,
    };
    // Trust any configured server that has disabled SSL
    if (config.disable_cert_validation) {
      init.agent = new https.Agent({
        rejectUnauthorized: false,
      });
    }
    this.init = init;
  }

  async get(path: string): Promise<Response> {
    try {
      return fetch(this.hostname + path, this.init);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getBatch(paths: Array<string>): Promise<Array<Response>> {
    const fetchPromises = paths.map((path) =>
      fetch(this.hostname + path, this.init).then((response) => {
        return response;
      }),
    );

    return await Promise.all(fetchPromises);
  }

  async post(path: string, params: Record<string, string>): Promise<Response> {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).map(([k, v]) => {
        searchParams.append(k, v);
      });

      const bodyToPost = {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: searchParams.toString(),
      };

      return fetch(this.hostname + path, bodyToPost);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default FHIRClient;
