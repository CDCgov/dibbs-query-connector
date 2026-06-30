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

# Loads a resource into Aidbox and aborts the seed if the write fails, instead
# of silently continuing. Aidbox validates every write against the external
# terminology service (tx.fhir.org); when that service is unreachable the write
# fails — the request either times out or returns a non-2xx OperationOutcome.
# Previously the seeder ignored both and reported "loaded successfully" anyway,
# leaving Aidbox empty and surfacing much later as confusing "0 resources" test
# failures. Capturing the status here turns that into an obvious seed-time error.
# Usage: load_or_fail "<description>" <curl args...>
load_or_fail() {
  local description=$1
  shift
  local response exit_code status body
  response=$(curl "${CURL_OPTS[@]}" -w $'\n%{http_code}' "$@")
  exit_code=$?
  status=$(printf '%s' "$response" | tail -n1)
  body=$(printf '%s' "$response" | sed '$d')
  if [ $exit_code -ne 0 ] || ! [[ "$status" =~ ^2[0-9][0-9]$ ]]; then
    echo "ERROR: ${description} failed (curl exit: ${exit_code}, HTTP status: ${status:-none})."
    echo "An empty/000 status or a validator/terminology error in the body usually means"
    echo "Aidbox's terminology service (tx.fhir.org) is unreachable. Verify it is up."
    echo "Response body: ${body}"
    exit 1
  fi

  # A FHIR batch returns HTTP 200 even when individual entries fail, so the
  # overall status above isn't enough for a batch load (e.g. GoldenSickPatient).
  # Inspect each entry's response.status and fail if any is non-2xx so a
  # partially-applied batch (the other way a tx.fhir.org outage shows up) is
  # caught at seed time instead of surfacing later as "0 resources". Single
  # resource responses aren't Bundles, so this yields nothing for them.
  local failed_entries
  failed_entries=$(printf '%s' "$body" | jq -r '
    if .resourceType == "Bundle" then
      [.entry[]? | .response.status // empty | select(test("^2[0-9][0-9]") | not)]
    else [] end | join(", ")' 2>/dev/null)
  if [ -n "$failed_entries" ]; then
    echo "ERROR: ${description} returned a batch response with failed entries (statuses: ${failed_entries})."
    echo "This usually means Aidbox's terminology service (tx.fhir.org) rejected one or more resources."
    echo "Response body: ${body}"
    exit 1
  fi
}

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
load_or_fail "Loading GoldenSickPatient data" -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d @"/data/GoldenSickPatient.json" \
  ${NETWORK_URL}/fhir

echo "GoldenSickPatient data loaded successfully."

# Client information for the SMART on FHIR test
echo "Loading client information into Aidbox..."
load_or_fail "Loading client information" -X PUT \
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
load_or_fail "Loading access policy information" -X PUT \
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
