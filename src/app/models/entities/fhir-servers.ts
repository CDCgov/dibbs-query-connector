// Define the type for the FHIR server configurations
export interface FhirServerConfig {
  id: string;
  name: string;
  hostname: string;
  headers?: Record<string, string>;
  lastConnectionAttempt?: string;
  lastConnectionSuccessful?: boolean;
  disableCertValidation: boolean;
  defaultServer: boolean;
  authType?: "none" | "basic" | "client_credentials" | "SMART";
  clientId?: string;
  clientSecret?: string;
  tokenEndpoint?: string;
  scopes?: string;
  accessToken?: string;
  tokenExpiry?: string;
  patientMatchConfiguration?: {
    enabled: boolean;
    onlyCertainMatches: boolean;
    matchCount: number;
    supportsMatch: boolean;
  };
}
