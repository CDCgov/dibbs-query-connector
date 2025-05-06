ALTER TABLE fhir_servers
ADD COLUMN default_server BOOLEAN NOT NULL DEFAULT FALSE;

-- Add a unique constraint that only applies when default_server is TRUE
CREATE UNIQUE INDEX idx_fhir_servers_single_default
ON fhir_servers (default_server)
WHERE default_server = TRUE;
