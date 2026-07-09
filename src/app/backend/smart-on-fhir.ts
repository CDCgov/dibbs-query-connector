import { importPKCS8, SignJWT } from "jose";
import crypto from "crypto";
import { getOrCreateSigningKey } from "./signing-keys";

// Epic (and the SMART spec) reject assertions whose exp is more than 5
// minutes in the future at the time the request is *received*; 4 minutes
// leaves margin for clock skew and network latency.
const JWT_EXPIRY_SECONDS = 240;

/**
 * Create and sign a JWT for SMART on FHIR authentication
 * @param clientId - The client ID
 * @param tokenEndpoint - The token endpoint URL
 * @returns The signed JWT
 */
export async function createSmartJwt(clientId: string, tokenEndpoint: string) {
  try {
    const { kid, alg, privateKeyPem } = await getOrCreateSigningKey();
    const privateKey = await importPKCS8(privateKeyPem, alg);

    const now = Math.floor(Date.now() / 1000);

    const payload = {
      iss: clientId, // Issuer (your client ID)
      sub: clientId, // Subject (your client ID)
      aud: tokenEndpoint, // Audience (token endpoint URL)
      exp: now + JWT_EXPIRY_SECONDS,
      jti: crypto.randomUUID(), // Unique identifier
      iat: now, // Issued at time
    };

    // No jku header: token servers must verify against the JWKS URL (or
    // static key) registered for the client, and Epic rejects assertions
    // whose jku differs from the registered JWK Set URL.
    const jwt = await new SignJWT(payload)
      .setProtectedHeader({
        alg,
        typ: "JWT",
        kid,
      })
      .sign(privateKey);

    return jwt;
  } catch (error) {
    console.error("Error creating JWT:", error);
    throw new Error("Failed to create JWT");
  }
}
