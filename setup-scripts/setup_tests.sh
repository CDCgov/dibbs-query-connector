#!/bin/bash
set -e  # Fail loudly instead of letting setup errors slip through

# setup needed .env values
> .env.test

echo "DATABASE_URL=postgresql://postgres:pw@localhost:5432/tefca_db" >> .env.test
echo "AUTH_SECRET=UbYPIMJwuiUrb+kK7gO6+aSb46iYf1rKgWcOTIve9EplWV8YU45vufLQTB8=" >> .env.test
echo NEXT_PUBLIC_AUTH_PROVIDER=keycloak >> .env.test
echo LOCAL_DB_CLIENT_TIMEOUT="10000" >> .env.test
echo ERSD_API_KEY="blah" >> .env.test
echo UMLS_API_KEY="bleh" >> .env.test

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