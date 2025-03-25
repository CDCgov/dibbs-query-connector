#!/bin/bash

# Run flyway migrations
flyway -configFiles=/flyway/conf/flyway.conf -schemas=public -connectRetries=60 migrate
echo "Flyway migrations complete."

# Start the server
node server.js
