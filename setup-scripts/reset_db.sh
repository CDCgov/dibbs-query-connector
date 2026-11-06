#!/usr/bin/env bash
set -e 

echo "Waiting for database to be healthy..."
until [ "$(docker compose ps --format json db | grep -o '"Health":"healthy"')" != "" ]; do 
    sleep 1 
done 

echo "Resetting data..."
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
    TRUNCATE TABLE conditions CASCADE; 
    TRUNCATE TABLE valuesets CASCADE; 
    TRUNCATE TABLE concepts CASCADE;
    TRUNCATE TABLE category_data;
    TRUNCATE TABLE query CASCADE;
"'

echo "Database reset complete"