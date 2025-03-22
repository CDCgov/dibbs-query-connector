#!/bin/bash

# Check if keys/jwks.json exists
if [ -f keys/jwks.json ]; then
  echo "JWKS already exists. Skipping key generation."
  exit 0
fi

mkdir -p keys

# Generate RSA key pair and JWKS for SMART on FHIR
set -e
if [ ! -f keys/rsa-private.pem ]; then
  echo "Generating new RSA key pair..."

  # Generate RSA 2048-bit key pair (standard for RSA with RS384)
  openssl genrsa -out keys/rsa-private.pem 2048
  openssl rsa -in keys/rsa-private.pem -pubout -out keys/rsa-public.pem

  # Generate JWKS
  jwksetinfer keys/rsa-private.pem >keys/jwks.json

  # Generate a UUID and replace kid in jwks.json using jq
  KID=$(uuidgen)
  jq --arg KID "$KID" '.keys[0].kid = $KID' keys/jwks.json >keys/jwks.json.tmp

  # Add algorithm to jwks.json
  jq '.keys[0].alg = "RS384"' keys/jwks.json.tmp >keys/jwks.json
  rm keys/jwks.json.tmp

  # Fix permissions
  chmod 600 keys/rsa-private.pem
  chmod 644 keys/rsa-public.pem keys/jwks.json

  echo "Key generation complete."
else
  echo "Using existing keys."
fi
