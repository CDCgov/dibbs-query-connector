ALTER TABLE fhir_servers
ADD COLUMN client_id text,
ADD COLUMN client_secret text,
ADD COLUMN token_endpoint text,
ADD COLUMN scopes text,
ADD COLUMN access_token text,
ADD COLUMN token_expiry timestamp with time zone,
ADD COLUMN auth_type text DEFAULT 'none';
