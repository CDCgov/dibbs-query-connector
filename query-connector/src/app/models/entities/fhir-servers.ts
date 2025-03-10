// Define the type for the FHIR server configurations
export type FhirServerConfig = {
  id: string;
  name: string;
  hostname: string;
  last_connection_attempt: Date;
  last_connection_successful: boolean;
  headers: Record<string, string>;
  disable_cert_validation: boolean;
};
