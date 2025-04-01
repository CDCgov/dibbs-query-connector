#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status
docker compose down --volumes --remove-orphans
docker compose -f docker-compose-integration.yaml up -d

# wait for flyway to finish running before...
docker compose -f docker-compose-integration.yaml logs -f aidbox-seeder | grep -q "Finished configuring Aidbox and database."

BASE_CMD="DATABASE_URL=postgresql://postgres:pw@localhost:5432/tefca_db TEST_TYPE=integration jest "
# running our integration tests
if [ "$JUST_INTEGRATION" = "true" ]; then 
    JEST_CMD="$BASE_CMD --testPathPattern=tests/integration"
else 
# assuming that the only reason we'd want to run both the unit and integration tests is in the CI context where we need to gather coverage report info
    JEST_CMD="$BASE_CMD --testPathIgnorePatterns='/e2e/' --ci --json --coverage --testLocationInResults --outputFile=report.json"
fi 
eval $JEST_CMD
JEST_EXIT_CODE=$?

# Teardown containers
docker compose -f docker-compose-integration.yaml down

# Exit with the Jest exit code
exit $JEST_EXIT_CODE
