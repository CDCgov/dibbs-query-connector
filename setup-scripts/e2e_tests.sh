#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status. Comment this if debugging in CI

chmod +x ./setup-scripts/setup_e2e.sh
bash ./setup-scripts/setup_e2e.sh

echo "AIDBOX_BASE_URL=http://aidbox:8080" >> .env.e2e
echo "APP_HOSTNAME=http://query-connector:3000" >> .env.e2e
echo "NEXT_PUBLIC_AUTH_PROVIDER=keycloak" >> .env.e2e

docker compose down --volumes --remove-orphans
docker compose -f docker-compose-e2e.yaml --env-file .env.e2e up -d --build 

# uncomment these and the corresponding block in ci.yaml to get logs in CI. Make sure also to comment the set -e command at the top of this file too!
# mkdir test-results
# docker compose -f docker-compose-e2e.yaml logs query-connector >> test-results/logs-before-tests.txt
# docker compose -f docker-compose-e2e.yaml logs query-aidbox >> test-results/logs-before-tests.txt

# wait for Aidbox seeder to finish running before...
docker compose -f docker-compose-e2e.yaml logs -f aidbox-seeder | grep -q "Finished configuring Aidbox and database."
command_pid=$!

echo -n "Waiting for Aidbox seeder to complete."
while kill -0 $command_pid 2>/dev/null; do
    echo -n "."
    sleep 1
done

echo -e "\nAidbox seeder finished!"
dotenv -e ./.env.e2e -- npx playwright test --reporter=list
E2E_EXIT_CODE=$?

# uncomment these and the corresponding block in the ci.yaml to get the CI logs
# docker compose -f docker-compose-e2e.yaml logs query-connector >> test-results/logs-after-tests.txt
# docker compose -f docker-compose-e2e.yaml logs aidbox >> test-results/logs-after-tests.txt

# Teardown containers
docker compose -f docker-compose-e2e.yaml down

exit $E2E_EXIT_CODE



