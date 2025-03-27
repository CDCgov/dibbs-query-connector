import fs from "fs";
import path from "path";
import { importPKCS8, SignJWT } from "jose";
import crypto from "crypto";
import { generateKeyPair, exportJWK, exportPKCS8 } from "jose";

export const DEFAULT_LOCAL_JWKS_HOSTNAME =
  "http://host.docker.internal:3000/.well-known/jwks.json";

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
export async function getPrivateKey() {
  try {
    const privateKeyPath = path.join(process.cwd(), "keys", "rsa-private.pem");
    return fs.readFileSync(privateKeyPath, "utf-8");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("no such file or directory")
    ) {
      const keysDir = ensureKeysDirectory();
      const privateKeyPath = path.join(keysDir, "rsa-private.pem");
      const publicKeyPath = path.join(keysDir, "rsa-public.pem");
      const jwksPath = path.join(keysDir, "jwks.json");

      await createKeyPair(privateKeyPath, publicKeyPath, jwksPath);
      return fs.readFileSync(privateKeyPath, "utf-8");
    } else {
      console.error("Error loading private key:", error);
      throw new Error("Failed to load private key");
    }
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

    const privateKeyPem = await getPrivateKey();

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

// Ensure keys directory exists
function ensureKeysDirectory() {
  const keysDir = path.join(process.cwd(), "keys");
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }
  return keysDir;
}

/**
 * Generate or load RSA key pair and JWKS
 * @returns the JWK for use within the SMART flow
 */
export async function getOrCreateKeys() {
  const keysDir = ensureKeysDirectory();
  const privateKeyPath = path.join(keysDir, "rsa-private.pem");
  const publicKeyPath = path.join(keysDir, "rsa-public.pem");
  const jwksPath = path.join(keysDir, "jwks.json");

  // Check if keys already exist
  if (
    fs.existsSync(privateKeyPath) &&
    fs.existsSync(publicKeyPath) &&
    fs.existsSync(jwksPath)
  ) {
    // Keys exist, load JWKS
    const jwksContent = fs.readFileSync(jwksPath, "utf-8");
    return JSON.parse(jwksContent);
  }

  const jwks = await createKeyPair(privateKeyPath, publicKeyPath, jwksPath);
  return jwks;
}

async function createKeyPair(
  privateKeyPath: string,
  publicKeyPath: string,
  jwksPath: string,
) {
  console.info("Generating new RSA key pair and JWKS...");

  // Generate new RSA key pair
  const { privateKey, publicKey } = await generateKeyPair("RS384", {
    modulusLength: 2048,
    extractable: true,
  });

  // Export keys
  const privateKeyPem = await exportPKCS8(privateKey);
  const publicJwk = await exportJWK(publicKey);

  // Generate a key ID (kid)
  const kid = crypto.randomUUID();

  // Add required properties to JWK
  publicJwk.kid = kid;
  publicJwk.alg = "RS384";
  publicJwk.use = "sig";

  // Create JWKS
  const jwks = {
    keys: [publicJwk],
  };

  // Write keys to files
  fs.writeFileSync(privateKeyPath, privateKeyPem, { mode: 0o600 }); // Private key with restricted permissions
  fs.writeFileSync(publicKeyPath, JSON.stringify(publicJwk, null, 2), {
    mode: 0o644,
  });
  fs.writeFileSync(jwksPath, JSON.stringify(jwks, null, 2), { mode: 0o644 });

  console.info("Key generation complete. Key ID:", kid);
  return jwks;
}
