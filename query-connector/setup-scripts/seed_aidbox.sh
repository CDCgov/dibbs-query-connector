#!/bin/bash

# Environment variables set by docker-compose
BASE_URL=$1
APP_HOSTNAME=$2
NETWORK_URL=http://aidbox:8080
AIDBOX_CLIENT_SECRET="L6AGe_5V2O"
DB_ADDRESS="db"
DB_PORT="5432"
DB_USERNAME="postgres"
DB_PASSWORD="pw"
DB_NAME="tefca_db"

# Wait for Aidbox to be healthy
echo "Waiting for Aidbox to become healthy..."
max_retries=15
attempt=0
while [ $attempt -le $max_retries ]; do
  health_status=$(curl -v -L -o /dev/null -w "%{http_code}" ${NETWORK_URL}/health || echo "000")
  if [[ "$health_status" -ge 200 && "$health_status" -lt 300 ]]; then
    echo "Aidbox is healthy!"
    break
  else
    echo "Waiting for Aidbox health check to pass (status: $health_status)... Attempt $attempt/$max_retries"

    if [ $attempt -eq $max_retries ]; then
      echo "Maximum retry attempts reached. Exiting."
      exit 1
    fi

    attempt=$((attempt + 1))
    sleep 10
  fi
done

# Get the access token
echo "Getting access token..."
TOKEN_RESPONSE=$(curl -L -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "root",
    "client_secret": "'${AIDBOX_CLIENT_SECRET}'",
    "grant_type": "client_credentials",
    "audience": "'${NETWORK_URL}'"
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
curl -L -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d @"/data/GoldenSickPatient.json" \
  ${NETWORK_URL}/fhir

echo "GoldenSickPatient data loaded successfully."

# Client information for the SMART on FHIR test
echo "Loading client information into Aidbox..."
curl -L -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "type": "client-confidential-asymmetric",
    "active": true,
    "auth": {
      "client_credentials": {
        "client_assertion_types": [
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
        ],
        "access_token_expiration": 300,
        "token_format": "jwt"
      }
    },
    "scope": [
      "system/*.read"
    ],
    "grant_types": [
      "client_credentials"
    ]
  }' \
  ${NETWORK_URL}/Client/e2e-smart-test-client

echo "Client information data loaded successfully."

# Access policy information for the SMART on FHIR test
echo "Loading access policy information into Aidbox.."
curl -L -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
      "engine": "allow",
      "link": [
        {
          "id": "e2e-smart-test-client",
          "resourceType": "Client"
        }
      ]
    }' \
  ${NETWORK_URL}/AccessPolicy/e2e-smart-test-client

echo "Access policy information data loaded successfully."

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
