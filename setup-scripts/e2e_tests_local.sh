#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status. Comment this if debugging in CI

chmod +x ./setup-scripts/setup_tests.sh
bash ./setup-scripts/setup_tests.sh
npx playwright install --with-deps

echo "APP_HOSTNAME=http://localhost:3000" >> .env.test
echo AIDBOX_BASE_URL="http://localhost:8080" >> .env.test
echo "DATABASE_URL=postgresql://postgres:pw@localhost:5432/tefca_db" >> .env.test
echo "AUTH_DISABLED=true" >> .env.test
echo "RUN_FETCH_INTERCEPTOR=true" >> .env.test

# pull down any exisiting docker volumes to make sure we're starting fresh
docker compose down --volumes --remove-orphans

# use the dev docker compose setup to allow for hot-reloading locally 
docker compose --env-file .env.test up -d 

# wait for Aidbox seeder to finish
echo -n "Seeding Aidbox"
while ! docker compose --env-file .env.test logs aidbox-seeder 2>/dev/null | grep -q "Finished configuring Aidbox and database."; do
    echo -n "."
    sleep 2
done
echo -n "Done!"

# Run Next dev without auth to allow the test's to work
npx dotenv run -q -f ./.env.test -- next dev --turbopack &

echo "Waiting Next server to be healthy..."
while ! nc -z localhost 3000; do
  sleep 1
done
echo "Next.js server is up!"

npx dotenv run -q -f ./.env.test -- npx playwright test --ui

docker compose down --volumes --remove-orphans