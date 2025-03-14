#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status
docker compose down --volumes --remove-orphans
docker compose -f docker-compose-e2e.yaml up -d

# wait for Aidbox seeder to finish running before...
docker compose -f docker-compose-e2e.yaml logs -f aidbox-seeder | grep -q "Finished configuring Aidbox and database."

BASE_CMD="npx dotenv -e ./.env -- npx playwright test "
# running our e2e tests
if [ "$RUN_WITH_UI" = "true" ]; then 
    E2E_CMD="$BASE_CMD  --ui"
else 
    E2E_CMD="$BASE_CMD --reporter=list"
fi 

eval $E2E_CMD

# Teardown containers
docker compose -f docker-compose-integration.yaml down
