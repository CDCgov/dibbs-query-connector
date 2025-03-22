import fs from "fs";
import path from "path";

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
