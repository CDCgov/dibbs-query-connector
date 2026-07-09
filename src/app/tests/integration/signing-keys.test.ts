import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import {
  exportJWK,
  exportPKCS8,
  generateKeyPair,
  importJWK,
  jwtVerify,
} from "jose";
import dbService from "@/app/backend/db/service";
import {
  clearSigningKeyCache,
  getOrCreateSigningKey,
  getSigningJwks,
} from "@/app/backend/signing-keys";
import { createSmartJwt } from "@/app/backend/smart-on-fhir";
import { suppressConsoleLogs } from "./fixtures";

// A scratch keys dir with no key files, so tests exercise the
// generate-in-db path rather than importing any local dev keys/ dir
const EMPTY_KEYS_DIR = fs.mkdtempSync(
  path.join(os.tmpdir(), "signing-keys-empty-"),
);

async function resetKeys() {
  clearSigningKeyCache();
  await dbService.query("DELETE FROM signing_keys;");
}

describe("signing key persistence", () => {
  beforeEach(async () => {
    suppressConsoleLogs();
    await resetKeys();
  });

  afterAll(async () => {
    // leave a key behind for any suites that run after this one
    clearSigningKeyCache();
  });

  it("generates and persists a key when none exists, then reuses it", async () => {
    const first = await getOrCreateSigningKey(EMPTY_KEYS_DIR);
    expect(first.kid).toBeDefined();
    expect(first.alg).toBe("RS384");
    expect(first.privateKeyPem).toContain("BEGIN PRIVATE KEY");
    expect(first.publicJwk.kid).toBe(first.kid);

    // Same key comes back on subsequent calls, including across a cache clear
    // (i.e. a simulated restart / second replica)
    const second = await getOrCreateSigningKey(EMPTY_KEYS_DIR);
    expect(second.kid).toBe(first.kid);

    clearSigningKeyCache();
    const afterRestart = await getOrCreateSigningKey(EMPTY_KEYS_DIR);
    expect(afterRestart.kid).toBe(first.kid);
    expect(afterRestart.privateKeyPem).toBe(first.privateKeyPem);

    const rows = await dbService.query("SELECT kid FROM signing_keys;");
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0].kid).toBe(first.kid);
  });

  it("creates exactly one key under concurrent access", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => getOrCreateSigningKey(EMPTY_KEYS_DIR)),
    );

    const kids = new Set(results.map((r) => r.kid));
    expect(kids.size).toBe(1);

    const rows = await dbService.query("SELECT kid FROM signing_keys;");
    expect(rows.rows).toHaveLength(1);
  });

  it("imports a legacy on-disk key pair instead of generating a new one", async () => {
    // Lay down a key pair in the format the previous file-based
    // implementation (setup-scripts/gen-keys.ts) wrote
    const keysDir = fs.mkdtempSync(path.join(os.tmpdir(), "signing-keys-"));
    const { privateKey, publicKey } = await generateKeyPair("RS384", {
      modulusLength: 2048,
      extractable: true,
    });
    const kid = crypto.randomUUID();
    const publicJwk = await exportJWK(publicKey);
    publicJwk.kid = kid;
    publicJwk.alg = "RS384";
    publicJwk.use = "sig";
    fs.writeFileSync(
      path.join(keysDir, "jwks.json"),
      JSON.stringify({ keys: [publicJwk] }),
    );
    fs.writeFileSync(
      path.join(keysDir, "rsa-private.pem"),
      await exportPKCS8(privateKey),
    );

    const imported = await getOrCreateSigningKey(keysDir);
    expect(imported.kid).toBe(kid);

    const rows = await dbService.query("SELECT kid FROM signing_keys;");
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0].kid).toBe(kid);
  });

  it("serves the persisted public key as a JWKS that verifies SMART JWTs", async () => {
    const jwt = await createSmartJwt(
      "test-client-id",
      "https://example.org/oauth2/token",
    );

    const jwks = await getSigningJwks();
    expect(jwks.keys).toHaveLength(1);
    expect(jwks.keys[0].kty).toBe("RSA");
    // Private material must never appear in the served JWKS
    expect(jwks.keys[0]).not.toHaveProperty("d");

    const publicKey = await importJWK(jwks.keys[0], "RS384");
    const { payload, protectedHeader } = await jwtVerify(jwt, publicKey, {
      audience: "https://example.org/oauth2/token",
    });
    expect(protectedHeader.kid).toBe(jwks.keys[0].kid);
    expect(payload.iss).toBe("test-client-id");
  });
});
