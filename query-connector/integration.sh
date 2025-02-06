#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status
docker compose down --volumes --remove-orphans
docker compose -f docker-compose-integration.yaml up -d

# wait for flyway to finish running before...
docker compose -f docker-compose-integration.yaml logs -f flyway | grep -q "Successfully applied\|No migration necessary"

BASE_CMD="DATABASE_URL=postgresql://postgres:pw@localhost:5432/tefca_db TEST_TYPE=integration jest "
# running our integration tests
if [ "$GENERATE_COVERAGE_REPORT" = "true" ]; then 
    JEST_CMD="$BASE_CMD --testPathIgnorePatterns='/e2e/' --ci --json --coverage --testLocationInResults --outputFile=report.json"
else 
    JEST_CMD="$BASE_CMD --testPathPattern=tests/integration"
fi 
eval $JEST_CMD
JEST_EXIT_CODE=$?

# Teardown containers
docker compose -f docker-compose-integration.yaml down

# Exit with the Jest exit code
exit $JEST_EXIT_CODE
