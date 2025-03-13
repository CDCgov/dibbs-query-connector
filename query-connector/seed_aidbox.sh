#!/bin/bash

# Environment variables set by docker-compose
BASE_URL=$1
NETWORK_URL=http://aidbox:8080
AIDBOX_CLIENT_SECRET="L6AGe_5V2O"
DB_ADDRESS="db"
DB_PORT="5432"
DB_USERNAME="postgres"
DB_PASSWORD="pw"
DB_NAME="tefca_db"

# Wait for Aidbox to be healthy
echo "Waiting for Aidbox to become healthy..."
while true; do
  health_status=$(curl -s -o /dev/null -w "%{http_code}" ${NETWORK_URL}/health || echo "000")
  if [ "$health_status" = "200" ]; then
    echo "Aidbox is healthy!"
    break
  else
    echo "Waiting for Aidbox health check to pass (status: $health_status)..."
    sleep 10
  fi
done

# Get the access token
echo "Getting access token..."
TOKEN_RESPONSE=$(curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "root",
    "client_secret": "'${AIDBOX_CLIENT_SECRET}'",
    "grant_type": "client_credentials",
    "audience": "'${BASE_URL}'"
  }' \
  ${NETWORK_URL}/auth/token)

# Extract the access_token value
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"//;s/"//')

if [ -z "$TOKEN" ]; then
  echo "Failed to obtain access token. Response was: $TOKEN_RESPONSE"
  exit 1
fi

echo "Access token obtained."

# Post the GoldenSickPatient data to Aidbox
echo "Loading GoldenSickPatient data into Aidbox..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d @"/data/GoldenSickPatient.json" \
  ${NETWORK_URL}/fhir

echo "GoldenSickPatient data loaded successfully."

# Get current datetime in ISO 8601 format
CURRENT_DATETIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Wait for the database to be ready
echo "Waiting for database to be ready..."
until PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_ADDRESS}" -p "${DB_PORT}" -U "${DB_USERNAME}" -d "${DB_NAME}" -c '\q'; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is available"

# Insert into fhir_servers table directly
echo "Inserting data into fhir_servers table..."
PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_ADDRESS}" -p "${DB_PORT}" -U "${DB_USERNAME}" -d "${DB_NAME}" <<EOF
INSERT INTO fhir_servers (
  name,
  hostname,
  headers,
  last_connection_attempt,
  last_connection_successful,
  disable_cert_validation
) VALUES (
  'Aidbox',
  '${BASE_URL}/fhir',
  '{"Authorization": "Bearer ${TOKEN}"}'::jsonb,
  '${CURRENT_DATETIME}'::timestamp,
  true,
  false
)
ON CONFLICT(name)
DO UPDATE SET
  hostname = '${BASE_URL}/fhir',
  headers = '{"Authorization": "Bearer ${TOKEN}"}'::jsonb
;
EOF

echo "Finished configuring Aidbox and database."
