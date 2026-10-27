#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status. Comment this if debugging in CI

# On any error before tests run (most commonly: aidbox-seeder failing to come up),
# dump compose logs so the actual failure is visible in CI output instead of just
# the cryptic `service "aidbox-seeder" didn't complete successfully: exit 1`.
dump_logs_on_failure() {
  local code=$?
  if [ $code -ne 0 ]; then
    echo "=== docker compose logs (failure dump) ==="
    docker compose -f docker-compose-integration.yaml logs --no-color || true
    echo "=== end docker compose logs ==="
  fi
  return $code
}
trap dump_logs_on_failure ERR

chmod +x ./setup-scripts/setup_tests.sh
bash ./setup-scripts/setup_tests.sh

echo TEST_TYPE="integration" >> .env.test
echo APP_HOSTNAME="http://localhost:3000" >> .env.test
echo AIDBOX_BASE_URL="http://localhost:8080" >> .env.test
echo "DATABASE_URL=postgresql://postgres:pw@localhost:5432/tefca_db" >> .env.test

docker compose down --volumes --remove-orphans
docker compose -f docker-compose-integration.yaml build aidbox
docker compose -f docker-compose-integration.yaml up -d

# wait for Aidbox to finish running before...
docker compose -f docker-compose-integration.yaml logs aidbox-seeder | grep -q "Finished configuring Aidbox and database"

BASE_CMD="npx dotenv run -q -f .env.test -- jest"

# running our integration tests
if [ "$JUST_INTEGRATION" = "true" ]; then 
    JEST_CMD="$BASE_CMD --testPathPatterns=tests/integration/"
else 
# assuming that the only reason we'd want to run both the unit and integration tests is in the CI context where we need to gather coverage report info
    JEST_CMD="$BASE_CMD --testPathIgnorePatterns='/e2e/' --coverage"
fi
eval $JEST_CMD
JEST_EXIT_CODE=$?


# Teardown containers
docker compose -f docker-compose-integration.yaml down

# Exit with the Jest exit code
exit $JEST_EXIT_CODE
