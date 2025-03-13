#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status
docker compose down --volumes --remove-orphans
docker compose -f docker-compose-e2e.yaml up -d

# wait for flyway to finish running before...
docker compose -f docker-compose-e2e.yaml logs -f aidbox_seeder | grep -q "Finished configuring Aidbox and database."

npx dotenv -e ./.env -- npx playwright test --ui

# Teardown containers
docker compose -f docker-compose-integration.yaml down
