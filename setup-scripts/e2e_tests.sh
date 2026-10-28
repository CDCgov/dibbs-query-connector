#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status. Comment this if debugging in CI

# Surface compose logs on any startup failure so CI shows the real cause
# (otherwise we only get `service "X" didn't complete successfully: exit 1`).
dump_logs_on_failure() {
  local code=$?
  if [ $code -ne 0 ]; then
    echo "=== docker compose logs (failure dump) ==="
    docker compose -f docker-compose.yml -f docker-compose.test.yml logs --no-color || true
    echo "=== end docker compose logs ==="
  fi
  return $code
}
trap dump_logs_on_failure ERR

chmod +x ./setup-scripts/setup_tests.sh
bash ./setup-scripts/setup_tests.sh

echo "AUTH_DISABLED=true" >> .env.test
echo "RUN_FETCH_INTERCEPTOR=true" >> .env.test
echo "DEMO_MODE=true" >> .env.test

echo "AIDBOX_BASE_URL=http://aidbox:8080" >> .env.test
echo "APP_HOSTNAME=http://query-connector:3000" >> .env.test
echo "NEXT_PUBLIC_AUTH_PROVIDER=keycloak"  >> .env.test

npx playwright install --with-deps

docker compose down --volumes --remove-orphans
docker compose -f docker-compose.yaml -f docker-compose.test.yaml --env-file .env.test up -d --build

npx dotenv run -q -f ./.env.test -- npx playwright test --reporter=list

E2E_EXIT_CODE=$?

# Teardown containers
docker compose -f docker-compose.yaml -f docker-compose.test.yaml down

exit $E2E_EXIT_CODE



