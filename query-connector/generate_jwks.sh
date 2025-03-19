#!/bin/bash

# Check if keys/jwks.json exists
if [ -f keys/jwks.json ]; then
  echo "JWKS already exists. Skipping key generation."
  exit 0
fi

mkdir -p keys

# Generate ECDSA key pair and JWKS for SMART on FHIR
set -e
if [ ! -f keys/ec384-private.pem ]; then
  echo "Generating new ECDSA key pair..."

  # Generate ECDSA P-384 key pair
  openssl ecparam -name secp384r1 -genkey -noout -out keys/ec384-private.pem
  openssl ec -in keys/ec384-private.pem -pubout -out keys/ec384-public.pem

  # Generate JWKS
  jwksetinfer keys/ec384-private.pem >keys/jwks.json

  # Generate a UUID and replace kid in jwks.json using jq
  KID=$(uuidgen)
  jq --arg KID "$KID" '.keys[0].kid = $KID' keys/jwks.json >keys/jwks.json.tmp

  # Add algorithm to jwks.json
  jq '.keys[0].alg = "ES384"' keys/jwks.json.tmp >keys/jwks.json

  # Fix permissions
  chmod 600 keys/ec384-private.pem
  chmod 644 keys/ec384-public.pem keys/jwks.json

  echo "Key generation complete."
else
  echo "Using existing keys."
fi
