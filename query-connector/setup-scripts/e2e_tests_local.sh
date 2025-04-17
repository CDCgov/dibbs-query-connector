#!/bin/bash

# setup needed .env values
> .env.e2e
echo "DATABASE_URL=postgresql://postgres:pw@localhost:5432/tefca_db" >> .env.e2e
echo "AIDBOX_BASE_URL=http://localhost:8080" >> .env.e2e
echo "APP_HOSTNAME=http://host.internal.docker:3000" >> .env.e2e
echo "AUTH_DISABLED=true" >> .env.e2e
echo "AUTH_SECRET=verysecretsecret" >> .env.e2e

value=$(grep "^AIDBOX_LICENSE=" .env | cut -d '=' -f2)

# Check if the value was found
if [ -n "$value" ]; then
     echo "AIDBOX_LICENSE=$value" >> .env.e2e
  echo "Value copied successfully"
else
  echo "Variable not found in source file"
fi
# pull down any exisiting docker volumes to make sure we're starting fresh
docker compose down --volumes --remove-orphans

# use the dev docker compose setup to allow for hot-reloading locally 
docker compose -f docker-compose-dev.yaml --env-file .env.e2e up -d 

# Start your command in the background
docker compose -f docker-compose-dev.yaml logs -f aidbox-seeder | grep -q "Finished configuring Aidbox and database." &
command_pid=$!

# Display a loading animation
echo "This next step will take a ~30 seconds or so"
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