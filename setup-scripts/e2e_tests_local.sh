#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status. Comment this if debugging in CI

chmod +x ./setup-scripts/setup_e2e.sh
bash ./setup-scripts/setup_e2e.sh

echo "AIDBOX_BASE_URL=http://localhost:8080" >> .env.e2e
echo "APP_HOSTNAME=http://host.docker.internal:3000" >> .env.e2e

# pull down any exisiting docker volumes to make sure we're starting fresh
docker compose down --volumes --remove-orphans

# use the dev docker compose setup to allow for hot-reloading locally 
docker compose -f docker-compose-dev.yaml --env-file .env.e2e up -d 

# Start your command in the background
docker compose -f docker-compose-dev.yaml logs -f aidbox-seeder | grep -q "Finished configuring Aidbox and database." &
command_pid=$!

# Display a loading animation
echo "This next step will take ~30 seconds or so"
echo -n "Waiting for Aidbox seeder to complete."
while kill -0 $command_pid 2>/dev/null; do
    echo -n "."
    sleep 1
done

echo -e "\nAidbox seeder finished!"

# Run Next dev without auth to allow the e2e's to work
npx dotenv -e ./.env.e2e -- next dev &

echo "Waiting Next server to be healthy..."
while ! nc -z localhost 3000; do
  sleep 1
done
echo "Next.js server is up!"

npx dotenv -e ./.env.e2e -- npx playwright test --ui

docker compose down --volumes --remove-orphans