ALTER TABLE query 
ADD COLUMN medical_record_sections JSON DEFAULT NULL;
DROP COLUMN IF EXISTS immunization;