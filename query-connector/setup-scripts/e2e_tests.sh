#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status. Comment this if debugging in CI
docker compose down --volumes --remove-orphans
docker compose -f docker-compose-e2e.yaml up -d --build 

# uncomment these and the corresponding block in ci.yaml to get logs in CI
# mkdir test-results
# docker compose -f docker-compose-e2e.yaml logs > /test-results/logs-before-tests.txt

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

# uncomment these and the corresponding block in the ci.yaml to get the CI logs
# docker compose -f docker-compose-e2e.yaml logs > /test-results/logs-after-tests.txt

# Teardown containers
docker compose -f docker-compose-e2e.yaml down

exit $E2E_EXIT_CODE