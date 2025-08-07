// Add this to your FhirServerConfig interface in models/entities/fhir-servers.ts
export type AuthType =
  | "none"
  | "basic"
  | "client_credentials"
  | "SMART"
  | "mutual_tls";
export interface FhirServerConfig {
  id: string;
  name: string;
  hostname: string;
  disableCertValidation: boolean;
  mutualTls?: boolean; // Add this property
  defaultServer: boolean;
  lastConnectionSuccessful?: boolean;
  lastConnectionAttempt?: string;
  headers?: Record<string, string>;
  authType?: AuthType;
  clientId?: string;
  clientSecret?: string;
  tokenEndpoint?: string;
  scopes?: string;
  accessToken?: string;
  tokenExpiry?: string;
  patientMatchConfiguration?: {
    enabled: boolean;
    onlySingleMatch: boolean;
    onlyCertainMatches: boolean;
    matchCount: number;
    supportsMatch: boolean;
  };
}
