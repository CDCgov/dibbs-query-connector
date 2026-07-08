CREATE INDEX IF NOT EXISTS audit_logs_created_at_index ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_author_index ON audit_logs (author);
CREATE INDEX IF NOT EXISTS audit_logs_action_type_index ON audit_logs (action_type);
