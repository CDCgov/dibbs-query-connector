-- Add columns for connection tracking
ALTER TABLE fhir_servers
ADD COLUMN last_connection_attempt TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_connection_successful BOOLEAN DEFAULT FALSE;

-- Update existing rows to have null values for new columns
UPDATE fhir_servers
SET last_connection_attempt = NULL,
    last_connection_successful = NULL;

-- Convert name index to unique constraint
DROP INDEX fhir_servers_name_index;
CREATE UNIQUE INDEX fhir_servers_name_index ON fhir_servers (name);
