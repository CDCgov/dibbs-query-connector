CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    author TEXT,
    action_type TEXT,
    audit_checksum TEXT,
    audit_message JSON
);

-- Create indexes for ids and foreign keys
CREATE INDEX IF NOT EXISTS audit_logs_id_index ON audit_logs (id);
