#!/bin/bash
set -o pipefail

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

# All curl invocations time-bound: --max-time caps each request so the seeder
# can never hang silently in CI when aidbox is slow to respond.
CURL_OPTS=(--silent --show-error --location --max-time 30)

# Compose already gates this service on `aidbox: service_healthy`, so by the
# time we run, /health should already be passing. The retry loop below is a
# belt-and-suspenders safety net for cases where the healthcheck and the
# seeder race (e.g. aidbox flapping immediately after first /health success).
echo "Verifying Aidbox is healthy..."
max_retries=30
attempt=0
while [ $attempt -lt $max_retries ]; do
  health_status=$(curl "${CURL_OPTS[@]}" -o /dev/null -w "%{http_code}" "${NETWORK_URL}/health" || echo "000")
  if [[ "$health_status" -ge 200 && "$health_status" -lt 300 ]]; then
    echo "Aidbox is healthy!"
    break
  fi
  attempt=$((attempt + 1))
  echo "Aidbox not ready yet (status: $health_status); attempt $attempt/$max_retries"
  if [ $attempt -eq $max_retries ]; then
    echo "Aidbox never became healthy. Dumping last response for debugging:"
    curl "${CURL_OPTS[@]}" -v "${NETWORK_URL}/health" || true
    exit 1
  fi
  sleep 5
done

# Get the access token
echo "Getting access token..."
TOKEN_RESPONSE=$(curl "${CURL_OPTS[@]}" -X POST \
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
curl "${CURL_OPTS[@]}" -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d @"/data/GoldenSickPatient.json" \
  ${NETWORK_URL}/fhir

echo "GoldenSickPatient data loaded successfully."

# Client information for the SMART on FHIR test
echo "Loading client information into Aidbox..."
curl "${CURL_OPTS[@]}" -X PUT \
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
    "jwks_uri": "'${APP_HOSTNAME}'/.well-known/jwks.json",
    "grant_types": [
      "client_credentials"
    ]
  }' \
  ${NETWORK_URL}/Client/query-connector

echo "Client information data loaded successfully."

# Access policy information for the SMART on FHIR test
echo "Loading access policy information into Aidbox.."
curl "${CURL_OPTS[@]}" -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
      "engine": "allow",
      "link": [
        {
          "id": "query-connector",
          "resourceType": "Client"
        }
      ]
    }' \
  ${NETWORK_URL}/AccessPolicy/query-connector

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
  last_connection_attempt,
  last_connection_successful,
  disable_cert_validation,
  auth_type,
  client_id,
  scopes,
  default_server
) VALUES (
  'Aidbox',
  '${BASE_URL}/fhir',
  '${CURRENT_DATETIME}'::timestamp,
  true,
  false,  
  'SMART',
  'query-connector',
  'system/*.read',
  true
)
ON CONFLICT(name)
DO UPDATE SET
  hostname = '${BASE_URL}/fhir',
  headers = '{"Authorization": "Bearer ${TOKEN}"}'::jsonb
;
EOF

echo "Finished configuring Aidbox and database."
