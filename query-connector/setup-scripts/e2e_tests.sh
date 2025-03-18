#!/bin/bash

docker compose down --volumes --remove-orphans
docker compose -f docker-compose-e2e.yaml --env-file .env up -d --build 

# wait for Aidbox seeder to finish running before...
docker compose -f docker-compose-e2e.yaml logs -f aidbox-seeder | grep -q "Finished configuring Aidbox and database."

npx dotenv -e ./.env -- npx playwright test --reporter=list
E2E_EXIT_CODE=$?

# Teardown containers
docker compose -f docker-compose-e2e.yaml down

exit $E2E_EXIT_CODE