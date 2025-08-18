import fs from "fs";
import path from "path";
import { importPKCS8, SignJWT } from "jose";
import crypto from "crypto";
import { DEFAULT_LOCAL_JWKS_HOSTNAME } from "../../../setup-scripts/gen-keys";

/**
 * Get the JWKS data from the file system
 * @returns The JWKS data
 */
export function getJwks() {
  try {
    const jwksPath = path.join(process.cwd(), "keys", "jwks.json");
    const jwksContent = fs.readFileSync(jwksPath, "utf-8");
    return JSON.parse(jwksContent);
  } catch (error) {
    console.error("Error loading JWKS:", error);
    throw new Error("Failed to load JWKS");
  }
}

/**
 * Get the private key for signing JWTs
 * @returns The private key
 */
export function getPrivateKey() {
  try {
    const keyPath = path.join(process.cwd(), "keys", "rsa-private.pem");
    return fs.readFileSync(keyPath, "utf-8");
  } catch (error) {
    console.error("Error loading private key:", error);
    throw new Error("Failed to load private key");
  }
}

/**
 * Get the public key for verifying JWTs
 * @returns The public key
 */
export function getPublicKey() {
  try {
    const keyPath = path.join(process.cwd(), "keys", "rsa-public.pem");
    return fs.readFileSync(keyPath, "utf-8");
  } catch (error) {
    console.error("Error loading public key:", error);
    throw new Error("Failed to load public key");
  }
}

/**
 * Get the kid (Key ID) from the JWKS
 * @returns The key ID
 */
export function getKeyId() {
  const jwks = getJwks();
  if (jwks.keys && jwks.keys.length > 0) {
    return jwks.keys[0].kid;
  }
  throw new Error("No key ID found in JWKS");
}

/**
 * Create and sign a JWT for SMART on FHIR authentication
 * @param clientId - The client ID
 * @param tokenEndpoint - The token endpoint URL
 * @returns The signed JWT
 */
export async function createSmartJwt(clientId: string, tokenEndpoint: string) {
  try {
    // Get the private key and key ID
    const privateKeyPem = getPrivateKey();
    const kid = getKeyId();
    const alg = "RS384";

    // Convert PEM to private key
    const privateKey = await importPKCS8(privateKeyPem, alg);

    // Create unique JWT ID
    const jti = crypto.randomUUID();

    // Get current time and expiry
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 300; // 5 minutes

    // Determine the JWKS URL - make sure this is an absolute URL that Aidbox can reach
    const jku = process.env.APP_HOSTNAME
      ? `${process.env.APP_HOSTNAME}/.well-known/jwks.json`
      : DEFAULT_LOCAL_JWKS_HOSTNAME;

    // Create payload
    const payload = {
      iss: clientId, // Issuer (your client ID)
      sub: clientId, // Subject (your client ID)
      aud: tokenEndpoint, // Audience (token endpoint URL)
      exp, // Expiration time
      jti, // Unique identifier
      iat: now, // Issued at time
    };

    // Create and sign the JWT
    const jwt = await new SignJWT(payload)
      .setProtectedHeader({
        alg, // Algorithm (RSA with SHA-384)
        typ: "JWT", // Type
        kid, // Key ID from your JWKS
        jku, // JWK Set URL
      })
      .sign(privateKey);

    return jwt;
  } catch (error) {
    console.error("Error creating JWT:", error);
    throw new Error("Failed to create JWT");
  }
}
