"use server";

import { AuthData } from "./service";
import FHIRClient from "./fhir-client";
import { isIP } from "net";

/**
 * Test the connection to a FHIR server
 * @param url - FHIR server URL
 * @param disableCertValidation - Whether to disable SSL certificate validation
 * @param mutualTls - Whether to use mutual TLS
 * @param authData - Optional authentication data
 * @returns A promise that resolves to the result of the connection test
 */
export async function testFhirServerConnection(
  url: string,
  disableCertValidation: boolean = false,
  mutualTls: boolean = false,
  authData?: AuthData,
) {
  validateFhirServerUrl(url);
  return FHIRClient.testConnection(
    url,
    disableCertValidation,
    mutualTls,
    authData,
  );
}

/**
 * Checks if a FHIR server supports the $match operation.
 * @param url - FHIR server base URL
 * @param disableCertValidation - Whether to disable SSL certificate validation
 * @param authData - Optional authentication and header data
 * @returns True if $match is supported and fhirVersion, false otherwise
 */
export async function checkFhirServerSupportsMatch(
  url: string,
  disableCertValidation: boolean = false,
  authData?: AuthData,
): Promise<{ supportsMatch: boolean; fhirVersion: string | null }> {
  validateFhirServerUrl(url);

  return FHIRClient.checkSupportsMatch(url, disableCertValidation, authData);
}

function validateFhirServerUrl(urlString: string): void {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error("Invalid URL format");
  }

  const hostname = url.hostname;
  if (
    !process.env.APP_HOSTNAME?.includes("localhost") &&
    process.env.DEMO_MODE !== "true" &&
    !process.env.AUTH_DISABLED
  ) {
    if (url.protocol !== "https:") {
      throw new Error("Only HTTPS protocol is allowed for FHIR server URLs.");
    }

    if (
      hostname === "localhost" ||
      hostname == "127.0.0.1" ||
      hostname === "::1"
    ) {
      throw new Error("Localhost addresses not allowed in production settings");
    }
  }

  const ipType = isIP(hostname);

  if (ipType) {
    if (
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      throw new Error("Private IP addresses are not allowed.");
    }
  }
}
