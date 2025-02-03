#!/bin/sh

# Use localhost as default environment if none specified
ENV=${ENVIRONMENT:-localhost}

# Copy the appropriate realm file for import
cp /opt/keycloak/$ENV.json /opt/keycloak/data/import/realm.json

# Start Keycloak with realm import
exec /opt/keycloak/bin/kc.sh start-dev --import-realm
