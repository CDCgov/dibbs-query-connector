-- Add an explicit endpoint_type to fhir_servers so the connectivity check and
-- patient discovery routing no longer assume mutual-TLS == fanout (/Task) queries.
-- Values: 'standard' (/Patient), 'immunization' (/Immunization), 'fanout' (/Task).
ALTER TABLE fhir_servers ADD COLUMN IF NOT EXISTS endpoint_type TEXT NOT NULL DEFAULT 'standard';

-- Preserve existing behavior: servers that used mutual TLS were always treated as
-- fanout (/Task-based) discovery, so backfill them to the 'fanout' endpoint type.
UPDATE fhir_servers SET endpoint_type = 'fanout' WHERE auth_type = 'mutual-tls';
