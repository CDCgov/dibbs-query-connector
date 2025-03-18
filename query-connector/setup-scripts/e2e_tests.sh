#!/bin/bash

docker compose down --volumes --remove-orphans
docker compose -f docker-compose-e2e.yaml --env-file .env up -d --build --no-cache

# wait for Aidbox seeder to finish running before...
docker compose -f docker-compose-e2e.yaml logs -f aidbox-seeder | grep -q "Finished configuring Aidbox and database."

npx dotenv -e ./.env -- npx playwright test --reporter=list

# Teardown containers
docker compose -f docker-compose-e2e.yaml down
