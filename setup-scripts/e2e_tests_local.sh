#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status. Comment this if debugging in CI

cleanup() {
  echo "Tearing down Docker environment..."
  docker compose down
}

# run cleanup after the script exits when the Playwright UI is closed
trap cleanup EXIT

chmod +x ./setup-scripts/setup_tests.sh
bash ./setup-scripts/setup_tests.sh
npx playwright install --with-deps

echo "AUTH_DISABLED=true" >> .env.test
echo "RUN_FETCH_INTERCEPTOR=true" >> .env.test
echo "AIDBOX_BASE_URL=http://aidbox:8080" >> .env.test

# pull down any exisiting docker volumes to make sure we're starting fresh
export COMPOSE_PROJECT_NAME=query-connector-test
docker compose down --volumes --remove-orphans

# use the dev docker compose setup to allow for hot-reloading locally 
ENV_FILE=.env.test npm run dev

echo "Waiting Next server to be healthy..."
while ! nc -z localhost 3000; do
  sleep 1
done
echo "Next.js server is up!"

npx dotenv run -q -f ./.env.test -- npx playwright test --ui

