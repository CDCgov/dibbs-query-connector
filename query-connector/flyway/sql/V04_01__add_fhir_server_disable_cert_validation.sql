ALTER TABLE fhir_servers
ADD COLUMN disable_cert_validation BOOLEAN DEFAULT FALSE;

-- Update rows with eHealthExchange in the server name to have disable_cert_validation set to true
UPDATE fhir_servers
SET disable_cert_validation = TRUE
WHERE name LIKE '%eHealthExchange%';

-- Update rows with eHealthExchange in the server name to strip the trailing slash from the hostname
UPDATE fhir_servers
SET hostname = regexp_replace(hostname, '/$', '')
WHERE name LIKE '%eHealthExchange%';
