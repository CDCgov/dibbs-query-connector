import fs from "fs";
import path from "path";
import crypto from "crypto";
import { exportPKCS8, exportJWK, generateKeyPair } from "jose";

function ensureKeysDirectory() {
  const keysDir = path.join(process.cwd(), "keys");
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }
  return keysDir;
}

async function getOrCreateKeys() {
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

getOrCreateKeys().catch((err) => {
  console.error("❌ Error generating keys:", err);
  process.exit(1);
});
