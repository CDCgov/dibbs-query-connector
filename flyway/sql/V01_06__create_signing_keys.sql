-- Persist SMART on FHIR signing keys in the database so they survive container
-- restarts/redeploys and are shared across replicas. Previously keys were
-- generated on the ephemeral container filesystem, which silently rotated the
-- key (and its kid) on every restart, breaking external JWKS registrations.
CREATE TABLE IF NOT EXISTS signing_keys (
    kid TEXT PRIMARY KEY,
    alg TEXT NOT NULL DEFAULT 'RS384',
    private_key_pem TEXT NOT NULL,
    public_jwk JSONB NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
