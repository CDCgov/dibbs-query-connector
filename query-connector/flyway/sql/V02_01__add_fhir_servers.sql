CREATE TABLE IF NOT EXISTS fhir_servers (
    id UUID DEFAULT uuid_generate_v4 (),
    name TEXT,
    hostname TEXT,
    headers JSON DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS fhir_servers_id_index ON fhir_servers (id);
CREATE INDEX IF NOT EXISTS fhir_servers_name_index ON fhir_servers (name);

INSERT INTO fhir_servers (name, hostname) VALUES ('Public HAPI: Direct','https://hapi.fhir.org/baseR4');