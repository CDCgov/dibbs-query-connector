#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status. Comment this if debugging in CI

# On any error before tests run (most commonly: aidbox-seeder failing to come up),
# dump compose logs so the actual failure is visible in CI output instead of just
# the cryptic `service "aidbox-seeder" didn't complete successfully: exit 1`.
dump_logs_on_failure() {
  local code=$?
  if [ $code -ne 0 ]; then
    echo "=== docker compose logs (failure dump) ==="
    docker compose -f docker-compose-integration.yaml logs --no-color || true
    echo "=== end docker compose logs ==="
  fi
  return $code
}
trap dump_logs_on_failure ERR

# make an env file
touch .env.integration
echo DATABASE_URL="postgresql://postgres:pw@localhost:5432/tefca_db" > .env.integration
echo NODE_ENV=production >> .env.integration
echo DEMO_MODE="true" >> .env.integration
echo RUN_FETCH_INTERCEPTOR="true" >> .env.integration
echo TEST_TYPE="integration" >> .env.integration
echo NEXT_PUBLIC_AUTH_PROVIDER=keycloak >> .env.integration
echo LOCAL_DB_CLIENT_TIMEOUT="10000" >> .env.integration
echo ERSD_API_KEY="blah" >> .env.integration
echo UMLS_API_KEY="bleh" >> .env.integration
echo APP_HOSTNAME="http://query-connector:3000" >> .env.integration
echo AIDBOX_BASE_URL="http://localhost:8080" >> .env.integration

value=$(grep -h "^AIDBOX_LICENSE=" .env .env.integration 2>/dev/null | head -n 1 | cut -d '=' -f2- || true)

# Check if the value was found
if [ -n "$value" ]; then
     echo "AIDBOX_LICENSE=$value" >> .env.integration
  echo "Aidbox license key copied successfully from local env file"
else
  echo "Aidbox license key not found in local env file"
fi

# Node >= 22.18 runs TypeScript directly via type stripping (ts-node 10 is
# incompatible with TypeScript 6 and fails to resolve @types/node).
node ./setup-scripts/gen-keys.ts


docker compose down --volumes --remove-orphans
docker compose -f docker-compose-integration.yaml up -d || {
  echo "=== Startup failed. Container states: ==="
  docker compose -f docker-compose-integration.yaml ps -a
  echo "=== Aidbox Logs ==="
  docker compose -f docker-compose-integration.yaml logs aidbox
  echo "=== Aidbox DB Logs ==="
  docker compose -f docker-compose-integration.yaml logs aidbox_db
  exit 1
}

BASE_CMD="npx dotenv run -q -f .env.integration -- jest"

# running our integration tests
if [ "$JUST_INTEGRATION" = "true" ]; then 
    JEST_CMD="$BASE_CMD --testPathPatterns=tests/integration/"
else 
# assuming that the only reason we'd want to run both the unit and integration tests is in the CI context where we need to gather coverage report info
    JEST_CMD="$BASE_CMD --testPathIgnorePatterns='/e2e/' --coverage"
fi
eval $JEST_CMD
JEST_EXIT_CODE=$?


# Teardown containers
docker compose -f docker-compose-integration.yaml down

# Exit with the Jest exit code
exit $JEST_EXIT_CODE
