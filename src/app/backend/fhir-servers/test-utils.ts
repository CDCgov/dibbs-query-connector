"use server";

import { AuthData } from "./service";
import FHIRClient from "./fhir-client";
import { isIP } from "net";
import { superAdminAccessCheck } from "@/app/utils/auth";

/**
 * These actions make outbound requests to caller-supplied URLs, so only super
 * admins (who manage FHIR servers) may call them.
 * @param key - name of the action, for the error message
 */
async function requireSuperAdmin(key: string) {
  if (!(await superAdminAccessCheck())) {
    throw Error(`Super admin permission check for ${key} failed`);
  }
}

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
  authData?: AuthData,
) {
  await requireSuperAdmin("testFhirServerConnection");
  await assertValidFhirServerUrl(url);
  return FHIRClient.testConnection(url, disableCertValidation, authData);
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
  await requireSuperAdmin("checkFhirServerSupportsMatch");
  await assertValidFhirServerUrl(url);

  return FHIRClient.checkSupportsMatch(url, disableCertValidation, authData);
}

/**
 * Validation function for whether a FHIR server value is valid
 * @param urlString - string to validate
 * @returns Resolves if the URL is valid, rejects with the reason otherwise
 */
export async function validateFhirServerUrl(urlString: string): Promise<void> {
  await requireSuperAdmin("validateFhirServerUrl");
  return assertValidFhirServerUrl(urlString);
}

/**
 * Throws if a FHIR server URL is malformed or points somewhere disallowed
 * @param urlString - string to validate
 */
async function assertValidFhirServerUrl(urlString: string): Promise<void> {
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
