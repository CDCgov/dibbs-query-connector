#!/bin/bash

KEY_FILE=$1
BASTION_IP=$2
DB_PASSWORD=$3
DB_ADDRESS=$4
DB_PORT=$5
DB_USERNAME=$6
DB_NAME=$7
BASE_URL=$8
AIDBOX_CLIENT_SECRET=$9

echo "Waiting for bastion host to become available..."
sleep 30
chmod 600 ${KEY_FILE}
ssh -o StrictHostKeyChecking=no -i ${KEY_FILE} \
  ec2-user@${BASTION_IP} \
  "PGPASSWORD='${DB_PASSWORD}' \
    psql -h ${DB_ADDRESS} \
    -p ${DB_PORT} \
    -U ${DB_USERNAME} \
    -d ${DB_NAME} \
    -c 'CREATE DATABASE aidbox;'"

# Wait for Aidbox to be healthy
echo "Waiting for Aidbox to become healthy..."
while true; do
  health_status=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/aidboxone/health || echo "000")
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
  ${BASE_URL}/aidboxone/auth/token)

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
  -d @"../../../src/app/tests/assets/GoldenSickPatient.json" \
  ${BASE_URL}/aidboxone/fhir

echo "GoldenSickPatient data loaded successfully."

# Get current datetime in ISO 8601 format
CURRENT_DATETIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create a temporary SQL file with the INSERT statement
cat >/tmp/insert_fhir_server.sql <<EOF
INSERT INTO fhir_servers (
  name,
  hostname,
  headers,
  last_connection_attempt,
  last_connection_successful,
  disable_cert_validation
) VALUES (
  'Aidbox',
  '${BASE_URL}/aidboxone',
  '{"Authorization": "Bearer ${TOKEN}"}'::jsonb,
  '${CURRENT_DATETIME}'::timestamp,
  true,
  false
);
EOF

# Copy the SQL file to the bastion host
scp -o StrictHostKeyChecking=no -i ${KEY_FILE} /tmp/insert_fhir_server.sql ec2-user@${BASTION_IP}:/tmp/insert_fhir_server.sql

# Execute the SQL file via the bastion host
echo "Inserting data into fhir_servers table..."
ssh -o StrictHostKeyChecking=no -i ${KEY_FILE} \
  ec2-user@${BASTION_IP} \
  "PGPASSWORD='${DB_PASSWORD}' \
   psql -h ${DB_ADDRESS} \
   -p ${DB_PORT} \
   -U ${DB_USERNAME} \
   -d ${DB_NAME} \
   -f /tmp/insert_fhir_server.sql && \
   rm -f /tmp/insert_fhir_server.sql"

# Clean up local temporary file
rm -f /tmp/insert_fhir_server.sql

echo "Finished configuring Aidbox and database."
