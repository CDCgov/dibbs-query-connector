ALTER TABLE query 
ADD COLUMN medical_record_sections JSON DEFAULT NULL;

ALTER TABLE query 
DROP COLUMN IF EXISTS immunization;