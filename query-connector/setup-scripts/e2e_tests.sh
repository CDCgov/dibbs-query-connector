#!/bin/bash

docker compose down --volumes --remove-orphans
docker compose -f docker-compose-e2e.yaml --env-file .env up -d

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
E2E_EXIT_CODE=$?

# Teardown containers
docker compose -f docker-compose-e2e.yaml down

exit $E2E_EXIT_CODE
