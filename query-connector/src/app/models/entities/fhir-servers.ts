// Define the type for the FHIR server configurations
export interface FhirServerConfig {
  id: string;
  name: string;
  hostname: string;
  headers?: Record<string, string>;
  last_connection_attempt?: string;
  last_connection_successful?: boolean;
  disable_cert_validation: boolean;
  auth_type?: "none" | "basic" | "client_credentials" | "SMART";
  client_id?: string;
  client_secret?: string;
  token_endpoint?: string;
  scopes?: string;
  access_token?: string;
  token_expiry?: string;
}
