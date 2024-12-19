#!/bin/bash

docker compose -f docker-compose-integration.yaml up -d

# wait for flyway to finish running before...
docker compose -f docker-compose-integration.yaml logs -f flyway | grep -q "Successfully applied"

# running our integration tests
jest --testPathPattern=tests/integration

# Teardown containers
docker compose -f docker-compose-integration.yaml down