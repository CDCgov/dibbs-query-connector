import fetch, { RequestInit, HeaderInit, Response } from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import { FhirServerConfig } from "./constants";
import { getFhirServerNames } from "./database-service";
import https from "https";

type DevFhirServerConfig = FhirServerConfig & { trustSelfSigned?: boolean };

/**
 * The configurations for the FHIR servers currently supported.
 */
const localE2EFhirServer =
  process.env.E2E_LOCAL_FHIR_SERVER ?? "http://hapi-fhir-server:8080/fhir";
export const fhirServers: Record<string, DevFhirServerConfig> = {
  "HELIOS Meld: Direct": {
    id: "HELIOS Meld: Direct",
    name: "HELIOS Meld: Direct",
    hostname: "https://gw.interop.community/HeliosConnectathonSa/open",
    headers: {},
  },
  "HELIOS Meld: eHealthExchange": configureEHX("MeldOpen"),
  "JMC Meld: Direct": {
    id: "JMC Meld: Direct",
    name: "JMC Meld: Direct",
    hostname: "https://gw.interop.community/JMCHeliosSTISandbox/open",
    headers: {},
  },
  "JMC Meld: eHealthExchange": configureEHX("JMCHelios"),
  // "Public HAPI: Direct": {
  //   id: "Public HAPI: Direct",
  //   name: "Public HAPI: Direct",
  //   hostname: "https://hapi.fhir.org/baseR4",
  //   headers: {},
  // },
  "Local e2e HAPI Server: Direct": {
    id: "Local e2e HAPI Server: Direct",
    name: "Local e2e HAPI Server: Direct",
    hostname: localE2EFhirServer,
    headers: {},
  },
  "OpenEpic: eHealthExchange": configureEHX("OpenEpic"),
  "CernerHelios: eHealthExchange": configureEHX("CernerHelios"),
  "OPHDST Meld: Direct": {
    id: "OPHDST Meld: Direct",
    name: "OPHDST Meld: Direct",
    hostname: "https://gw.interop.community/CDCSepHL7Connectatho/open",
    headers: {},
  },
};

/**
 * Configure eHealthExchange for a specific destination.
 * @param xdestination The x-destination header value
 * @returns The configuration for the server
 */
function configureEHX(xdestination: string): DevFhirServerConfig {
  const headers = {
    Accept: "application/json, application/*+json, */*",
    "Accept-Encoding": "gzip, deflate, br",
    "Content-Type": "application/fhir+json; charset=UTF-8",
    "X-DESTINATION": xdestination,
    "X-POU": "PUBHLTH",
    "X-Request-Id": uuidv4(),
    prefer: "return=representation",
    "Cache-Control": "no-cache",
  };
  if (xdestination === "CernerHelios") {
    (headers as Record<string, string>)["OAUTHSCOPES"] =
      "system/Condition.read system/Encounter.read system/Immunization.read system/MedicationRequest.read system/Observation.read system/Patient.read system/Procedure.read system/MedicationAdministration.read system/DiagnosticReport.read system/RelatedPerson.read";
  }
  return {
    id: xdestination,
    name: xdestination,
    hostname: "https://concept01.ehealthexchange.org:52780/fhirproxy/r4/",
    headers,
    trustSelfSigned: true,
  };
}

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
      config = fhirServers[server];
    }

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
    if (config.trustSelfSigned) {
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
      })
    );

    return await Promise.all(fetchPromises);
  }
}

export default FHIRClient;
