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
