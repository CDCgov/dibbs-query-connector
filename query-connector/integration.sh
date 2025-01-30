#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

docker compose -f docker-compose-integration.yaml up -d

# wait for flyway to finish running before...
docker compose -f docker-compose-integration.yaml logs -f flyway | grep -q "Successfully applied\|No migration necessary"

# running our integration tests
DATABASE_URL=postgresql://postgres:pw@localhost:5432/tefca_db TEST_TYPE=integration jest --testPathPattern=tests/integration
JEST_EXIT_CODE=$?

# Teardown containers
docker compose -f docker-compose-integration.yaml down

# Exit with the Jest exit code
exit $JEST_EXIT_CODE
