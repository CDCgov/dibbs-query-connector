CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS fhir_servers (
    id UUID DEFAULT uuid_generate_v4 (),
    name TEXT,
    hostname TEXT,
    headers JSON DEFAULT NULL
);

