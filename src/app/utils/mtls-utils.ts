import fs from "fs";
import path from "path";

/**
 * Ensure the keys directory exists
 * @returns The path to the keys directory
 */
function ensureKeysDirectory(): string {
  const keysDir = path.join(process.cwd(), "keys");
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }
  return keysDir;
}

/**
 * Get or create mutual TLS certificate
 * @returns The certificate content
 */
export function getOrCreateMtlsCert(): string {
  const keysDir = ensureKeysDirectory();
  const certPath = path.join(keysDir, "mtls-cert.pem");

  // Check if cert already exists
  if (fs.existsSync(certPath)) {
    return fs.readFileSync(certPath, "utf-8");
  }

  // If not, try to create from environment variable
  const certFromEnv = process.env.MTLS_CERT;
  if (!certFromEnv) {
    throw new Error(
      "Mutual TLS certificate not found in keys directory and MTLS_CERT environment variable is not set",
    );
  }
  const decodedCert = Buffer.from(certFromEnv, "base64").toString("utf-8");

  // Write cert from environment variable
  fs.writeFileSync(certPath, decodedCert, { mode: 0o600 });
  console.info("Mutual TLS certificate written from environment variable");

  return certFromEnv;
}

/**
 * Get or create mutual TLS key
 * @returns The key content
 */
export function getOrCreateMtlsKey(): string {
  const keysDir = ensureKeysDirectory();
  const keyPath = path.join(keysDir, "mtls-key.pem");

  // Check if key already exists
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath, "utf-8");
  }

  // If not, try to create from environment variable
  const keyFromEnv = process.env.MTLS_KEY;
  if (!keyFromEnv) {
    throw new Error(
      "Mutual TLS key not found in keys directory and MTLS_KEY environment variable is not set",
    );
  }
  const decodedKey = Buffer.from(keyFromEnv, "base64").toString("utf-8");

  // Write key from environment variable
  fs.writeFileSync(keyPath, decodedKey, { mode: 0o600 });
  console.info("Mutual TLS key written from environment variable");

  return keyFromEnv;
}

/**
 * Get or create mutual TLS CA
 * @returns The CA content
 */
export function getOrCreateMtlsCa(): string {
  const keysDir = ensureKeysDirectory();
  const caPath = path.join(keysDir, "mtls-ca.pem");

  // Check if CA already exists
  if (fs.existsSync(caPath)) {
    return fs.readFileSync(caPath, "utf-8");
  }

  // If not, try to create from environment variable
  const caFromEnv = process.env.MTLS_CA;
  if (!caFromEnv) {
    return "";
  }
  const decodedCa = Buffer.from(caFromEnv, "base64").toString("utf-8");

  // Write CA from environment variable
  fs.writeFileSync(caPath, decodedCa, { mode: 0o600 });
  console.info("Mutual TLS CA written from environment variable");

  return caFromEnv;
}

/**
 * Check if mutual TLS credentials are available
 * @returns true if both cert and key are available, false otherwise
 */
export function isMtlsAvailable() {
  const keysDir = ensureKeysDirectory();
  const certPath = path.join(keysDir, "mtls-cert.pem");
  const keyPath = path.join(keysDir, "mtls-key.pem");

  // Check if files exist
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    return true;
  }

  // Check if environment variables are set
  return !!(process.env.MTLS_CERT && process.env.MTLS_KEY);
}
