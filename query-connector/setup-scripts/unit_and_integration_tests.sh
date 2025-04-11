#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status
docker compose down --volumes --remove-orphans
docker compose -f docker-compose-integration.yaml up -d

# wait for Aidbox to finish running before...
docker compose -f docker-compose-integration.yaml logs -f aidbox-seeder | grep -q "Finished configuring Aidbox and database."

# uncomment these (and the set -e line at the top!) and the block in ci.yaml to get logs in CI
# mkdir test-results
# docker compose -f docker-compose-integration.yaml logs > /test-results/logs-before-tests.txt

BASE_CMD="DATABASE_URL=postgresql://postgres:pw@localhost:5432/tefca_db TEST_TYPE=integration npx jest "
# running our integration tests
if [ "$JUST_INTEGRATION" = "true" ]; then 
    JEST_CMD="$BASE_CMD --testPathPattern=tests/integration"
else 
# assuming that the only reason we'd want to run both the unit and integration tests is in the CI context where we need to gather coverage report info
    JEST_CMD="$BASE_CMD --testPathIgnorePatterns='/e2e/' --coverage"
fi 
eval $JEST_CMD
JEST_EXIT_CODE=$?

# uncomment these and the corresponding block in the ci.yaml to get the CI logs
# docker compose -f docker-compose-integration.yaml logs > /test-results/logs-after-tests.txt

# Teardown containers
# docker compose -f docker-compose-integration.yaml down

# Exit with the Jest exit code
exit $JEST_EXIT_CODE
