#!/bin/sh

# Print environment variable status for debugging
echo "ENVIRONMENT variable is set to: ${ENVIRONMENT:-not set}"
ENV=${ENVIRONMENT:-localhost}
echo "Using ENV value: $ENV"

# List available realm files
echo "Available realm files:"
ls -la /opt/keycloak/

# Copy the appropriate realm file for import
echo "Copying $ENV.json to realm.json"
cp /opt/keycloak/$ENV.json /opt/keycloak/data/import/realm.json

# Verify the copy
echo "Final import file contents:"
ls -la /opt/keycloak/data/import/
ls -la /opt/keycloak/data/import/realm.json

# Start Keycloak with realm import
exec /opt/keycloak/bin/kc.sh start-dev --import-realm
