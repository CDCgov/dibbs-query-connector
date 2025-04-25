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

-- Truncate existing table
TRUNCATE TABLE fhir_servers;

-- Direct FHIR servers
INSERT INTO fhir_servers (name, hostname, last_connection_attempt, last_connection_successful)
VALUES 
    ('Public HAPI: Direct', 'https://hapi.fhir.org/baseR4', current_timestamp, true),
    ('HELIOS Meld: Direct', 'https://gw.interop.community/HeliosConnectathonSa/open', current_timestamp, true),
    ('JMC Meld: Direct', 'https://gw.interop.community/JMCHeliosSTISandbox/open', current_timestamp, true),
    ('Local e2e HAPI Server: Direct', 'http://hapi-fhir-server:8080/fhir', current_timestamp, true),
    ('OPHDST Meld: Direct', 'https://gw.interop.community/CDCSepHL7Connectatho/open', current_timestamp, true);

-- eHealthExchange FHIR servers
INSERT INTO fhir_servers (name, hostname, headers, last_connection_attempt, last_connection_successful)
VALUES 
    ('HELIOS Meld: eHealthExchange', 
     'https://concept01.ehealthexchange.org:52780/fhirproxy/r4/',
     '{
        "Accept": "application/json, application/*+json, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/fhir+json; charset=UTF-8",
        "X-DESTINATION": "MeldOpen",
        "X-POU": "PUBHLTH",
        "prefer": "return=representation",
        "Cache-Control": "no-cache"
     }',
     current_timestamp,
     true),
    ('JMC Meld: eHealthExchange',
     'https://concept01.ehealthexchange.org:52780/fhirproxy/r4/',
     '{
        "Accept": "application/json, application/*+json, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/fhir+json; charset=UTF-8",
        "X-DESTINATION": "JMCHelios",
        "X-POU": "PUBHLTH",
        "prefer": "return=representation",
        "Cache-Control": "no-cache"
     }',
     current_timestamp,
     true),
    ('OpenEpic: eHealthExchange',
     'https://concept01.ehealthexchange.org:52780/fhirproxy/r4/',
     '{
        "Accept": "application/json, application/*+json, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/fhir+json; charset=UTF-8",
        "X-DESTINATION": "OpenEpic",
        "X-POU": "PUBHLTH",
        "prefer": "return=representation",
        "Cache-Control": "no-cache"
     }',
     current_timestamp,
     true),
    ('CernerHelios: eHealthExchange',
     'https://concept01.ehealthexchange.org:52780/fhirproxy/r4/',
     '{
        "Accept": "application/json, application/*+json, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/fhir+json; charset=UTF-8",
        "X-DESTINATION": "CernerHelios",
        "X-POU": "PUBHLTH",
        "prefer": "return=representation",
        "Cache-Control": "no-cache",
        "OAUTHSCOPES": "system/Condition.read system/Encounter.read system/Immunization.read system/MedicationRequest.read system/Observation.read system/Patient.read system/Procedure.read system/MedicationAdministration.read system/DiagnosticReport.read system/RelatedPerson.read"
     }',
     current_timestamp,
     true);
