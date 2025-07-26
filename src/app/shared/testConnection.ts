"use server";

import { AuthData } from "../backend/fhir-servers";
import FHIRClient from "./fhirClient";

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
 * @returns True if $match is supported, false otherwise
 */
export async function checkFhirServerSupportsMatch(
  url: string,
  disableCertValidation: boolean = false,
  authData?: AuthData,
): Promise<boolean> {
  return FHIRClient.checkSupportsMatch(url, disableCertValidation, authData);
}
