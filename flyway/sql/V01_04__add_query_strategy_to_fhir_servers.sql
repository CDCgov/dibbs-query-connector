-- Per-server query strategy so patient record retrieval can adapt to
-- vendor-specific FHIR search support (e.g. Epic: no POST
-- /MedicationStatement/_search, no `code` filtering on MedicationRequest,
-- text-only Encounter reason-code matching). Orthogonal to endpoint_type,
-- which routes patient discovery.
-- Values: 'default' (spec-standard searches), 'epic' (Epic-compatible searches).
ALTER TABLE fhir_servers
  ADD COLUMN IF NOT EXISTS query_strategy TEXT NOT NULL DEFAULT 'default';

COMMENT ON COLUMN fhir_servers.query_strategy IS 'Query strategy for patient record retrieval: default or epic';
