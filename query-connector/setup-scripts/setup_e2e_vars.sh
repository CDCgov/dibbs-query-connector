#!/bin/bash

# setup needed .env values
> .env.e2e
echo "DATABASE_URL=postgresql://postgres:pw@localhost:5432/tefca_db" >> .env.e2e
echo "AUTH_DISABLED=true" >> .env.e2e
echo "AUTH_SECRET='UbYPIMJwuiUrb+kK7gO6+aSb46iYf1rKgWcOTIve9EplWV8YU45vufLQTB8='" >> .env.e2e
echo "DEMO_MODE=true" >> .env.e2e

value=$(grep "^AIDBOX_LICENSE=" .env | cut -d '=' -f2)

# Check if the value was found
if [ -n "$value" ]; then
     echo "AIDBOX_LICENSE=$value" >> .env.e2e
  echo "Value copied successfully"
else
  echo "Variable not found in source file"
fi
