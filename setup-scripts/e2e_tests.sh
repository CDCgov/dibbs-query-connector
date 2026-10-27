#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status. Comment this if debugging in CI

# Surface compose logs on any startup failure so CI shows the real cause
# (otherwise we only get `service "X" didn't complete successfully: exit 1`).
dump_logs_on_failure() {
  local code=$?
  if [ $code -ne 0 ]; then
    echo "=== docker compose logs (failure dump) ==="
    docker compose -f docker-compose-e2e.yaml logs --no-color || true
    echo "=== end docker compose logs ==="
  fi
  return $code
}
trap dump_logs_on_failure ERR

chmod +x ./setup-scripts/setup_tests.sh
bash ./setup-scripts/setup_tests.sh

docker compose down --volumes --remove-orphans
docker compose -f docker-compose-e2e.yaml --env-file .env.test up -d --build

# uncomment these and the corresponding block in ci.yaml to get logs in CI. Make sure also to comment the set -e command at the top of this file too!
# mkdir test-results
# docker compose -f docker-compose-e2e.yaml logs query-connector >> test-results/logs-before-tests.txt
# docker compose -f docker-compose-e2e.yaml logs query-aidbox >> test-results/logs-before-tests.txt

# wait for Aidbox seeder to finish running before running the e2e tests
echo "Waiting for Aidbox seeder to complete..."

# poll the logs to find the exit message for Aidbox
while ! docker compose -f docker-compose-e2e.yaml --env-file .env.test logs aidbox-seeder 2>/dev/null | grep -q "Finished configuring Aidbox and database."; do
    echo -n "."
    sleep 2
done

echo "Aidbox seeder finished!"

npx dotenv run -q -f ./.env.test -- npx playwright test --reporter=list
E2E_EXIT_CODE=$?

# uncomment these and the corresponding block in the ci.yaml to get the CI logs
# docker compose -f docker-compose-e2e.yaml logs query-connector >> test-results/logs-after-tests.txt
# docker compose -f docker-compose-e2e.yaml logs aidbox >> test-results/logs-after-tests.txt

# Teardown containers
docker compose -f docker-compose-e2e.yaml down

exit $E2E_EXIT_CODE



