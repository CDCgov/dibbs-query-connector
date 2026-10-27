#!/bin/bash
set -e  # Fail loudly instead of letting setup errors slip through

touch .env.test

set_default_env() {
  local key="$1"
  local val="$2"
  if ! grep -q "^${key}=" .env.test 2>/dev/null; then
    echo "${key}=${val}" >> .env.test
  fi
}

set_default_env "DATABASE_URL" "postgresql://postgres:pw@localhost:5432/tefca_db"
set_default_env "AUTH_SECRET" "UbYPIMJwuiUrb+kK7gO6+aSb46iYf1rKgWcOTIve9EplWV8YU45vufLQTB8="
set_default_env "DEMO_MODE" "true"
set_default_env "RUN_FETCH_INTERCEPTOR" "true"
set_default_env "NEXT_PUBLIC_AUTH_PROVIDER" "keycloak"
set_default_env "LOCAL_DB_CLIENT_TIMEOUT" "10000"
set_default_env "ERSD_API_KEY" "blah"
set_default_env "UMLS_API_KEY" "bleh"

if [ "$IS_CI" = "true" ]; then
  set_default_env "APP_HOSTNAME" "http://query-connector:3000"
  set_default_env "AIDBOX_BASE_URL" "http://aidbox:8080"
else
  set_default_env "APP_HOSTNAME" "http://localhost:3000"
  set_default_env "AIDBOX_BASE_URL" "http://localhost:8080"
fi

if grep -q "^AIDBOX_LICENSE=" .env.test 2>/dev/null && [ -n "$(grep "^AIDBOX_LICENSE=" .env.test | cut -d '=' -f2-)" ]; then
  echo "Aidbox license key already present in .env.test"
else
  value=$(grep -h "^AIDBOX_LICENSE=" .env 2>/dev/null | head -n 1 | cut -d '=' -f2- || true)
  value="${value:-$AIDBOX_LICENSE}"

  if [ -n "$value" ]; then
    echo "AIDBOX_LICENSE=$value" >> .env.test
    echo "Aidbox license key copied successfully"
  else
    echo "Aidbox license key not found in local env file or environment"
    exit 1
  fi
fi

# Node >= 22.18 runs TypeScript directly via type stripping (ts-node 10 is
# incompatible with TypeScript 6 and fails to resolve @types/node).
node ./setup-scripts/gen-keys.ts
