import fs from "fs";
import path from "path";
import crypto from "crypto";
import { exportJWK, exportPKCS8, generateKeyPair, JWK } from "jose";
import dbService, { DbClient } from "./db/service";

export type SigningKey = {
  kid: string;
  alg: string;
  privateKeyPem: string;
  publicJwk: JWK;
};

const SIGNING_KEY_ALG = "RS384";

// Arbitrary constant naming the Postgres advisory lock that serializes
// first-time key creation, so concurrent replicas can't each generate a
// different key.
const SIGNING_KEYS_LOCK_ID = 728394001;

const SELECT_CURRENT_KEY = `
  SELECT kid, alg, private_key_pem, public_jwk
  FROM signing_keys
  WHERE active = TRUE
  ORDER BY created_at DESC, kid
  LIMIT 1;
`;

// The signing key is immutable for the lifetime of the process (rotation adds
// a new row and only takes effect on restart), so a module-level cache avoids
// a DB round trip per token request.
let cachedSigningKey: SigningKey | undefined;

/**
 * Clear the in-memory signing key cache. Only intended for tests that need to
 * exercise the DB read/create paths repeatedly within one process.
 */
export function clearSigningKeyCache() {
  cachedSigningKey = undefined;
}

/**
 * Get the signing key for SMART on FHIR JWT assertions, creating and
 * persisting one if none exists yet. Keys live in the database so they
 * survive restarts and are shared across replicas. On first run, any key
 * pair already present on disk (from a previous version of the app, which
 * stored keys on the container filesystem) is imported so external JWKS
 * registrations keep working.
 * @param keysDir - Directory searched for legacy on-disk keys to import.
 * Defaults to the `keys` directory the previous file-based implementation
 * wrote to.
 * @returns The active signing key
 */
export async function getOrCreateSigningKey(
  keysDir: string = path.join(process.cwd(), "keys"),
): Promise<SigningKey> {
  if (cachedSigningKey) {
    return cachedSigningKey;
  }

  const existing = await dbService.query(SELECT_CURRENT_KEY);
  if (existing.rows.length > 0) {
    cachedSigningKey = existing.rows[0] as SigningKey;
    return cachedSigningKey;
  }

  await createSigningKey(keysDir);

  // Re-read rather than trusting the insert result: if a concurrent replica
  // won the race, its key is the one we must sign with.
  const persisted = await dbService.query(SELECT_CURRENT_KEY);
  if (persisted.rows.length === 0) {
    throw new Error("Failed to load or create signing key");
  }
  cachedSigningKey = persisted.rows[0] as SigningKey;
  return cachedSigningKey;
}

/**
 * Get the JWKS containing the public keys of all active signing keys, for
 * serving at /.well-known/jwks.json. Ensures a key exists so that partners
 * can register the JWKS URL before the app has ever signed a JWT.
 * @returns The JWKS key set
 */
export async function getSigningJwks(): Promise<{ keys: JWK[] }> {
  await getOrCreateSigningKey();

  const result = await dbService.query(
    `SELECT public_jwk FROM signing_keys WHERE active = TRUE ORDER BY created_at, kid;`,
  );
  // getOrCreateSigningKey guarantees at least one active key, so an empty
  // result means the read failed (dbService.query swallows errors into an
  // empty result set). Verifiers that refetch our JWKS must get an error
  // response, never a 200 with no keys they could cache.
  if (result.rows.length === 0) {
    throw new Error("Failed to load signing keys for JWKS");
  }
  return { keys: result.rows.map((r) => r.publicJwk as JWK) };
}

/**
 * Insert a signing key inside a transaction guarded by an advisory lock,
 * importing legacy on-disk keys when present and generating a fresh key pair
 * otherwise. No-ops if another caller already inserted a key.
 * @param keysDir - Directory searched for legacy on-disk keys
 */
async function createSigningKey(keysDir: string): Promise<void> {
  const client = new DbClient();
  await client.connect();
  try {
    await client.query("BEGIN");
    // DbClient.query swallows errors into an empty result set, so a failed
    // BEGIN wouldn't throw. The lock statement errors outside a transaction
    // and returns exactly one row inside one, so an empty result here means
    // we do NOT hold the lock (or the transaction) and must not proceed.
    const lock = await client.query("SELECT pg_advisory_xact_lock($1)", [
      SIGNING_KEYS_LOCK_ID,
    ]);
    if (lock.rows.length !== 1) {
      throw new Error("Failed to acquire signing key advisory lock");
    }

    // Another replica may have created the key while we waited on the lock
    const existing = await client.query(SELECT_CURRENT_KEY);
    if (existing.rows.length === 0) {
      const material =
        importKeysFromDisk(keysDir) ?? (await generateKeyMaterial());
      const inserted = await client.query(
        `INSERT INTO signing_keys (kid, alg, private_key_pem, public_jwk)
         VALUES ($1, $2, $3, $4)
         RETURNING kid;`,
        [
          material.kid,
          material.alg,
          material.privateKeyPem,
          JSON.stringify(material.publicJwk),
        ],
      );
      if (inserted.rows.length === 0) {
        throw new Error("Signing key insert returned no rows");
      }
      console.info("Persisted new signing key. Key ID:", material.kid);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.disconnect();
  }
}

/**
 * Generate a fresh RSA key pair as signing key material.
 * @returns The generated key
 */
async function generateKeyMaterial(): Promise<SigningKey> {
  const { privateKey, publicKey } = await generateKeyPair(SIGNING_KEY_ALG, {
    modulusLength: 2048,
    extractable: true,
  });

  const kid = crypto.randomUUID();
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = kid;
  publicJwk.alg = SIGNING_KEY_ALG;
  publicJwk.use = "sig";

  return {
    kid,
    alg: SIGNING_KEY_ALG,
    privateKeyPem: await exportPKCS8(privateKey),
    publicJwk,
  };
}

/**
 * Read a legacy file-based key pair (keys/jwks.json + keys/rsa-private.pem)
 * if one exists, so deployments upgrading from the file-based implementation
 * keep the key their partners have registered.
 * @param keysDir - Directory to search
 * @returns The imported key, or undefined if no usable key pair was found
 */
function importKeysFromDisk(keysDir: string): SigningKey | undefined {
  try {
    const jwksPath = path.join(keysDir, "jwks.json");
    const privateKeyPath = path.join(keysDir, "rsa-private.pem");
    if (!fs.existsSync(jwksPath) || !fs.existsSync(privateKeyPath)) {
      return undefined;
    }

    const jwks = JSON.parse(fs.readFileSync(jwksPath, "utf-8"));
    const publicJwk: JWK | undefined = jwks?.keys?.[0];
    if (!publicJwk?.kid) {
      return undefined;
    }

    // A mismatched pair persisted here would be permanent: every assertion
    // would be signed with a key the served JWKS can't verify, and unlike the
    // old file-based flow a restart wouldn't heal it.
    const privateKeyPem = fs.readFileSync(privateKeyPath, "utf-8");
    const probe = Buffer.from("signing-key-pair-check");
    const signature = crypto.sign(
      "sha384",
      probe,
      crypto.createPrivateKey(privateKeyPem),
    );
    const pairMatches = crypto.verify(
      "sha384",
      probe,
      crypto.createPublicKey({
        key: publicJwk as crypto.JsonWebKey,
        format: "jwk",
      }),
      signature,
    );
    if (!pairMatches) {
      throw new Error(
        "On-disk private key does not match the public JWK in jwks.json",
      );
    }

    console.info("Importing signing key from disk. Key ID:", publicJwk.kid);
    return {
      kid: publicJwk.kid,
      alg: publicJwk.alg ?? SIGNING_KEY_ALG,
      privateKeyPem,
      publicJwk,
    };
  } catch (error) {
    console.error(
      "Found on-disk keys but could not import them; generating a new key instead:",
      error,
    );
    return undefined;
  }
}
