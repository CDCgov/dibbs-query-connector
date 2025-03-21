#!/bin/bash

docker compose down --volumes --remove-orphans
docker compose -f docker-compose-e2e.yaml --env-file .env up -d --build 

# wait for Aidbox seeder to finish running before...
docker compose -f docker-compose-e2e.yaml logs -f aidbox-seeder | grep -q "Finished configuring Aidbox and database."
command_pid=$!

echo -n "Waiting for Aidbox seeder to complete."
while kill -0 $command_pid 2>/dev/null; do
    echo -n "."
    sleep 1
done

echo -e "\nAidbox seeder finished!"

npx dotenv -e ./.env -- npx playwright test --reporter=list
E2E_EXIT_CODE=$?

# Teardown containers
docker compose -f docker-compose-e2e.yaml down

exit $E2E_EXIT_CODE