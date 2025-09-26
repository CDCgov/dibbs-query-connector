CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS conditions (
    id TEXT PRIMARY KEY,
    system TEXT,
    name TEXT,
    version TEXT,
    category TEXT
);

CREATE TABLE IF NOT EXISTS category_data (
    condition_name TEXT,
    condition_code TEXT PRIMARY KEY,
    category TEXT,
    FOREIGN KEY(condition_code) REFERENCES conditions(id)
);

CREATE TABLE IF NOT EXISTS valuesets (
    id TEXT PRIMARY KEY,
    oid TEXT,
    version TEXT,
    name TEXT,
    author TEXT,
    type TEXT,
    dibbs_concept_type TEXT,
    user_created BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS concepts (
    id TEXT PRIMARY KEY,
    code TEXT,
    code_system TEXT,
    display TEXT
);

CREATE TABLE IF NOT EXISTS condition_to_valueset (
    id TEXT PRIMARY KEY,
    condition_id TEXT,
    valueset_id TEXT,
    source TEXT,
    FOREIGN KEY (condition_id) REFERENCES conditions(id),
    FOREIGN KEY (valueset_id) REFERENCES valuesets(id)
);

CREATE TABLE IF NOT EXISTS valueset_to_concept (
    id TEXT PRIMARY KEY,
    valueset_id TEXT,
    concept_id TEXT,
    FOREIGN KEY (valueset_id) REFERENCES valuesets(id),
    FOREIGN KEY (concept_id) REFERENCES concepts(id)
);

CREATE TABLE IF NOT EXISTS query (
    id UUID DEFAULT uuid_generate_v4 (),
    query_name VARCHAR(255) UNIQUE,
    query_data JSON,
    conditions_list TEXT[],
    author VARCHAR(255),
    date_created TIMESTAMP,
    date_last_modified TIMESTAMP,
    medical_record_sections JSON DEFAULT NULL,
    PRIMARY KEY (id));

ALTER TABLE query 
DROP COLUMN IF EXISTS immunization;

CREATE TABLE IF NOT EXISTS fhir_servers (
    id UUID DEFAULT uuid_generate_v4 (),
    name TEXT,
    hostname TEXT,
    headers JSON DEFAULT NULL,
    last_connection_attempt TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    last_connection_successful BOOLEAN DEFAULT FALSE,
    disable_cert_validation BOOLEAN DEFAULT FALSE,
    auth_type TEXT DEFAULT 'none',
    client_id TEXT,
    client_secret TEXT,
    token_endpoint TEXT,
    scopes TEXT,
    access_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    default_server BOOLEAN NOT NULL DEFAULT FALSE,
    patient_match_configuration JSON DEFAULT NULL,
    ca_cert TEXT DEFAULT NULL
    );

-- Add comments for documentation
COMMENT ON COLUMN fhir_servers.auth_type IS 'Authentication method: none, basic, client_credentials, or SMART';
COMMENT ON COLUMN fhir_servers.client_id IS 'Client identifier for OAuth flows';
COMMENT ON COLUMN fhir_servers.client_secret IS 'Client secret for client_credentials flow';
COMMENT ON COLUMN fhir_servers.token_endpoint IS 'OAuth token endpoint URL';
COMMENT ON COLUMN fhir_servers.scopes IS 'Space-separated list of OAuth scopes';
COMMENT ON COLUMN fhir_servers.access_token IS 'Current OAuth access token (if stored)';
COMMENT ON COLUMN fhir_servers.token_expiry IS 'Expiration timestamp for the current access token';


CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    qc_role TEXT,
    first_name TEXT,
    last_name TEXT
);

CREATE TABLE IF NOT EXISTS usergroup (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usergroup_to_users (
    id TEXT PRIMARY KEY,
    user_id UUID,
    usergroup_id UUID,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (usergroup_id) REFERENCES usergroup(id)
);

CREATE TABLE IF NOT EXISTS usergroup_to_query (
    id TEXT PRIMARY KEY,
    query_id UUID,
    usergroup_id UUID,
    FOREIGN KEY (query_id) REFERENCES query(id),
    FOREIGN KEY (usergroup_id) REFERENCES usergroup(id)
);

DROP TABLE IF EXISTS user_management;

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    author TEXT,
    action_type TEXT,
    audit_checksum TEXT,
    audit_message JSON
);

CREATE TABLE IF NOT EXISTS query_timeboxing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    time_window_start TIMESTAMP, 
    time_window_end TIMESTAMP,
    concept_type VARCHAR(80),
    query_id UUID,
    FOREIGN KEY (query_id) REFERENCES query(id) ON DELETE CASCADE,
    is_relative_range BOOLEAN DEFAULT true,
    -- each query <> concept_type relationship is unique
    UNIQUE (query_id, concept_type));

-- Create indexes for all primary and foreign keys

CREATE INDEX IF NOT EXISTS conditions_id_index ON conditions (id);
CREATE INDEX IF NOT EXISTS conditions_name_index ON conditions (name);

CREATE INDEX IF NOT EXISTS valuesets_id_index ON valuesets (id);

CREATE INDEX IF NOT EXISTS concepts_id_index ON concepts (id);

CREATE INDEX IF NOT EXISTS condition_to_valueset_id_index ON condition_to_valueset (id);
CREATE INDEX IF NOT EXISTS condition_to_valueset_condition_id_index ON condition_to_valueset (condition_id);
CREATE INDEX IF NOT EXISTS condition_to_valueset_valueset_id_index ON condition_to_valueset (valueset_id);

CREATE INDEX IF NOT EXISTS valueset_to_concept_id_index ON valueset_to_concept (id);
CREATE INDEX IF NOT EXISTS valueset_to_concept_valueset_id_index ON valueset_to_concept (valueset_id);
CREATE INDEX IF NOT EXISTS valueset_to_concept_concept_id_index ON valueset_to_concept (concept_id);

CREATE INDEX IF NOT EXISTS query_id_index ON query (id);
CREATE INDEX IF NOT EXISTS query_name_index ON query (query_name);

CREATE INDEX IF NOT EXISTS fhir_servers_id_index ON fhir_servers (id);
CREATE UNIQUE INDEX IF NOT EXISTS fhir_servers_name_index ON fhir_servers (name);
CREATE INDEX idx_fhir_servers_auth_type ON fhir_servers(auth_type);

CREATE INDEX IF NOT EXISTS user_id_index ON users (id);
CREATE INDEX IF NOT EXISTS user_username_index ON users (username);

CREATE INDEX IF NOT EXISTS usergroup_id_index ON usergroup (id);

CREATE INDEX IF NOT EXISTS usergroup_to_users_id_index ON usergroup_to_users (id);
CREATE INDEX IF NOT EXISTS usergroup_to_users_user_id_index ON usergroup_to_users (user_id);
CREATE INDEX IF NOT EXISTS usergroup_to_users_usergroup_id_index ON usergroup_to_users (usergroup_id);

CREATE INDEX IF NOT EXISTS usergroup_to_query_id_index ON usergroup_to_query (id);
CREATE INDEX IF NOT EXISTS usergroup_to_query_query_id_index ON usergroup_to_query (query_id);
CREATE INDEX IF NOT EXISTS usergroup_to_query_usergroup_id_index ON usergroup_to_query (usergroup_id);

CREATE INDEX IF NOT EXISTS audit_logs_id_index ON audit_logs (id);

CREATE INDEX IF NOT EXISTS query_timeboxing_id_index ON query_timeboxing (id);

-- Add a unique constraint that only applies when default_server is TRUE
CREATE UNIQUE INDEX idx_fhir_servers_single_default
ON fhir_servers (default_server)
WHERE default_server = TRUE;

-- Create default values
-- Direct FHIR servers
INSERT INTO fhir_servers (name, hostname, last_connection_attempt, last_connection_successful)
VALUES 
    ('Public HAPI: Direct', 'https://hapi.fhir.org/baseR4', current_timestamp, true)
    -- , ('HELIOS Meld: Direct', 'https://gw.interop.community/HeliosConnectathonSa/open', current_timestamp, true)
    -- , ('JMC Meld: Direct', 'https://gw.interop.community/JMCHeliosSTISandbox/open', current_timestamp, true)
    -- , ('Local e2e HAPI Server: Direct', 'http://hapi-fhir-server:8080/fhir', current_timestamp, true)
    -- , ('OPHDST Meld: Direct', 'https://gw.interop.community/CDCSepHL7Connectatho/open', current_timestamp, true)
    ;

-- eHealthExchange FHIR servers (optional)
-- INSERT INTO fhir_servers (name, hostname, headers, last_connection_attempt, last_connection_successful, disable_cert_validation)
-- VALUES 
--     ('HELIOS Meld: eHealthExchange', 
--      'https://concept01.ehealthexchange.org:52780/fhirproxy/r4',
--      '{
--         "Accept": "application/json, application/*+json, */*",
--         "Accept-Encoding": "gzip, deflate, br",
--         "Content-Type": "application/fhir+json; charset=UTF-8",
--         "X-DESTINATION": "MeldOpen",
--         "X-POU": "PUBHLTH",
--         "prefer": "return=representation",
--         "Cache-Control": "no-cache"
--      }',
--      current_timestamp,
--      true,
--      true),
--     ('JMC Meld: eHealthExchange',
--      'https://concept01.ehealthexchange.org:52780/fhirproxy/r4',
--      '{
--         "Accept": "application/json, application/*+json, */*",
--         "Accept-Encoding": "gzip, deflate, br",
--         "Content-Type": "application/fhir+json; charset=UTF-8",
--         "X-DESTINATION": "JMCHelios",
--         "X-POU": "PUBHLTH",
--         "prefer": "return=representation",
--         "Cache-Control": "no-cache"
--      }',
--      current_timestamp,
--      true,
--      true),
--     ('OpenEpic: eHealthExchange',
--      'https://concept01.ehealthexchange.org:52780/fhirproxy/r4',
--      '{
--         "Accept": "application/json, application/*+json, */*",
--         "Accept-Encoding": "gzip, deflate, br",
--         "Content-Type": "application/fhir+json; charset=UTF-8",
--         "X-DESTINATION": "OpenEpic",
--         "X-POU": "PUBHLTH",
--         "prefer": "return=representation",
--         "Cache-Control": "no-cache"
--      }',
--      current_timestamp,
--      true,
--      true),
--     ('CernerHelios: eHealthExchange',
--      'https://concept01.ehealthexchange.org:52780/fhirproxy/r4',
--      '{
--         "Accept": "application/json, application/*+json, */*",
--         "Accept-Encoding": "gzip, deflate, br",
--         "Content-Type": "application/fhir+json; charset=UTF-8",
--         "X-DESTINATION": "CernerHelios",
--         "X-POU": "PUBHLTH",
--         "prefer": "return=representation",
--         "Cache-Control": "no-cache",
--         "OAUTHSCOPES": "system/Condition.read system/Encounter.read system/Immunization.read system/MedicationRequest.read system/Observation.read system/Patient.read system/Procedure.read system/MedicationAdministration.read system/DiagnosticReport.read system/RelatedPerson.read"
--      }',
--      current_timestamp,
--      true,
--      true);

-- Migrate existing servers with Authorization headers to use the basic auth_type
UPDATE fhir_servers
SET auth_type = 'basic'
WHERE headers->>'Authorization' IS NOT NULL;

-- Audit log functions and triggers for tamper-resistance (ONC compliance)
-- Drop any existing triggers and functions
DROP TRIGGER IF EXISTS prevent_audit_update ON audit_logs;
DROP FUNCTION IF EXISTS raise_audit_update_error;

DROP TRIGGER IF EXISTS prevent_audit_delete ON audit_logs;
DROP FUNCTION IF EXISTS raise_audit_delete_error;

-- Function to raise error on UPDATE
CREATE FUNCTION raise_audit_update_error() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'UPDATEs to audit_logs are not permitted (ONC tamper-resistance compliance)';
END;
$$ LANGUAGE plpgsql;

-- Function to raise error on DELETE
CREATE FUNCTION raise_audit_delete_error() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'DELETEs from audit_logs are not permitted (ONC tamper-resistance compliance)';
END;
$$ LANGUAGE plpgsql;

-- Attach trigger for UPDATE
CREATE TRIGGER prevent_audit_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION raise_audit_update_error();

-- Attach trigger for DELETE
CREATE TRIGGER prevent_audit_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION raise_audit_delete_error();
