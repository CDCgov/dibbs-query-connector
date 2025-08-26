#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status. Comment this if debugging in CI
docker compose down --volumes --remove-orphans
docker compose -f docker-compose-integration.yaml up -d

# wait for Aidbox to finish running before...
docker compose -f docker-compose-integration.yaml logs aidbox-seeder | grep -q "Finished configuring Aidbox and database"

# uncomment these and the corresponding block in ci.yaml to get logs in CI. Make sure also to comment the set -e command at the top of this file too!
#mkdir test-results
#docker compose -f docker-compose-integration.yaml logs > test-results/logs-before-tests.txt

# make an env file
touch .env.integration
echo DATABASE_URL="postgresql://postgres:pw@localhost:5432/tefca_db" > .env.integration
echo DEMO_MODE="true" >> .env.integration
echo TEST_TYPE="integration" >> .env.integration
echo NEXT_PUBLIC_AUTH_PROVIDER=keycloak >> .env.integration
echo APP_HOSTNAME=http://query-connector:3000 >> .env.integration
echo LOCAL_DB_CLIENT_TIMEOUT="10000" >> .env.integration

BASE_CMD="npx dotenv -e .env.integration -- jest"

# running our integration tests
if [ "$JUST_INTEGRATION" = "true" ]; then 
    JEST_CMD="$BASE_CMD --testPathPatterns=tests/integration/"
else 
# assuming that the only reason we'd want to run both the unit and integration tests is in the CI context where we need to gather coverage report info
    JEST_CMD="$BASE_CMD --testPathIgnorePatterns=[\"/e2e/\"] --coverage"
fi
eval $JEST_CMD
JEST_EXIT_CODE=$?

# uncomment these and the corresponding block in ci.yaml to get logs in CI
#docker compose -f docker-compose-integration.yaml logs > test-results/logs-after-tests.txt

# Teardown containers
docker compose -f docker-compose-integration.yaml down

# Exit with the Jest exit code
exit $JEST_EXIT_CODE
