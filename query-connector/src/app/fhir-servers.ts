import fetch, { RequestInit, HeaderInit, Response } from "node-fetch";
import { FhirServerConfig } from "./constants";
import https from "https";

type DevFhirServerConfig = FhirServerConfig & { trustSelfSigned?: boolean };

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
    let config: DevFhirServerConfig | undefined = configurations.find(
      (config) => config.name === server
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
    // Trust eHealth Exchange's self-signed certificate
    if (config.trustSelfSigned)
      init.agent = new https.Agent({
        rejectUnauthorized: false,
      });
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
      })
    );

    return await Promise.all(fetchPromises);
  }
}

export default FHIRClient;
