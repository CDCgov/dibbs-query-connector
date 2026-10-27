#!/bin/bash
set -e  # Fail loudly instead of letting setup errors slip through

# setup needed .env values
> .env.test
echo "DATABASE_URL=postgresql://postgres:pw@localhost:5432/tefca_db" >> .env.test
echo "AUTH_SECRET=UbYPIMJwuiUrb+kK7gO6+aSb46iYf1rKgWcOTIve9EplWV8YU45vufLQTB8=" >> .env.test
echo "DEMO_MODE=true" >> .env.test
echo "RUN_FETCH_INTERCEPTOR=true" >> .env.test
echo NODE_ENV=production >> .env.test
echo NEXT_PUBLIC_AUTH_PROVIDER=keycloak >> .env.test
echo LOCAL_DB_CLIENT_TIMEOUT="10000" >> .env.test
echo ERSD_API_KEY="blah" >> .env.test
echo UMLS_API_KEY="bleh" >> .env.test

if [ "$IS_CI" = "true" ]; then
  echo APP_HOSTNAME="http://query-connector:3000" >> .env.test
  echo AIDBOX_BASE_URL="http://aidbox:8080" >> .env.test
else
  echo APP_HOSTNAME="http://localhost:3000" >> .env.test
  echo AIDBOX_BASE_URL="http://localhost:8080" >> .env.test
fi

value=$(grep -h "^AIDBOX_LICENSE=" .env .env.test 2>/dev/null | head -n 1 | cut -d '=' -f2- || true)

# Check if the value was found
if [ -n "$value" ]; then
     echo "AIDBOX_LICENSE=$value" >> .env.test
  echo "Aidbox license key copied successfully from local env file"
else
  echo "Aidbox license key not found in local env file"
fi

# Node >= 22.18 runs TypeScript directly via type stripping (ts-node 10 is
# incompatible with TypeScript 6 and fails to resolve @types/node).
node ./setup-scripts/gen-keys.ts
