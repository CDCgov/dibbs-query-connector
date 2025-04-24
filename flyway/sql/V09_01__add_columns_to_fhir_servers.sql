-- Add new authentication columns to fhir_servers table
ALTER TABLE fhir_servers 
ADD COLUMN auth_type text DEFAULT 'none',
ADD COLUMN client_id text,
ADD COLUMN client_secret text,
ADD COLUMN token_endpoint text,
ADD COLUMN scopes text,
ADD COLUMN access_token text,
ADD COLUMN token_expiry timestamp with time zone;

-- Migrate existing servers with Authorization headers to use the basic auth_type
UPDATE fhir_servers
SET auth_type = 'basic'
WHERE headers->>'Authorization' IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX idx_fhir_servers_auth_type ON fhir_servers(auth_type);

-- Add comments for documentation
COMMENT ON COLUMN fhir_servers.auth_type IS 'Authentication method: none, basic, client_credentials, or SMART';
COMMENT ON COLUMN fhir_servers.client_id IS 'Client identifier for OAuth flows';
COMMENT ON COLUMN fhir_servers.client_secret IS 'Client secret for client_credentials flow';
COMMENT ON COLUMN fhir_servers.token_endpoint IS 'OAuth token endpoint URL';
COMMENT ON COLUMN fhir_servers.scopes IS 'Space-separated list of OAuth scopes';
COMMENT ON COLUMN fhir_servers.access_token IS 'Current OAuth access token (if stored)';
COMMENT ON COLUMN fhir_servers.token_expiry IS 'Expiration timestamp for the current access token';
