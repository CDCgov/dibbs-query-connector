#!/usr/bin/env bash
set -e 

echo "Waiting for database to be healthy..."
until [ "$(docker compose ps --format json db | grep -o '"Health":"healthy"')" != "" ]; do 
    sleep 1 
done 

echo "Resetting data..."

# category_data is conditionally created / destroyed in seed flow, but just in 
# case, create and truncate it 
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
    TRUNCATE TABLE conditions CASCADE; 
    TRUNCATE TABLE valuesets CASCADE; 
    TRUNCATE TABLE concepts CASCADE;
    TRUNCATE TABLE query CASCADE;

    CREATE TABLE IF NOT EXISTS category_data();
    DROP TABLE category_data CASCADE;
"'

echo "Database reset complete"