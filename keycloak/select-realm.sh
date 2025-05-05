#!/bin/sh

# Print environment variable status for debugging
echo "ENVIRONMENT variable is set to: ${ENVIRONMENT:-not set}"
ENV=${ENVIRONMENT:-localhost}
echo "Using ENV value: $ENV"

# Detect if running on an M4 Mac (Apple Silicon)
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
  CPU_INFO=$(sysctl -n machdep.cpu.brand_string 2>/dev/null)
  if echo "$CPU_INFO" | grep -q "M4"; then
    echo "Detected M4 Mac. Applying workaround for Keycloak."
    export JAVA_OPTS_APPEND="-XX:UseSVE=0"
  fi
fi

# Copy the appropriate realm file for import
echo "Copying $ENV.json to realm.json"
cp /opt/keycloak/$ENV.json /opt/keycloak/data/import/realm.json

# Start Keycloak with realm import
exec /opt/keycloak/bin/kc.sh start-dev --import-realm
