#!/bin/bash

# If SSL CA path is set, append SSL params to Flyway JDBC URL
FLYWAY_SSL_ARGS=""
if [ -n "$DB_SSL_CA_PATH" ] && [ -n "$FLYWAY_URL" ]; then
  FLYWAY_SSL_ARGS="-url=${FLYWAY_URL}?sslmode=verify-full&sslrootcert=${DB_SSL_CA_PATH}"
fi

# Run flyway migrations
# shellcheck disable=SC2086
flyway -configFiles=/flyway/conf/flyway.conf -schemas=public -connectRetries=60 $FLYWAY_SSL_ARGS migrate
echo "Flyway migrations complete."

# Start the server
node server.js
