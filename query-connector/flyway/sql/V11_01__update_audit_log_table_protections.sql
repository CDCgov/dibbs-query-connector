-- V124__audit_log_prevent_update_delete.sql

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
