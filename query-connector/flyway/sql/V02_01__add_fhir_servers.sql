CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS fhir_servers (
    id UUID DEFAULT uuid_generate_v4 (),
    name TEXT,
    hostname TEXT,
    headers JSON DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS fhir_servers_id_index ON fhir_servers (id);
CREATE INDEX IF NOT EXISTS fhir_servers_name_index ON fhir_servers (name);