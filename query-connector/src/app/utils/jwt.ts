import { SignJWT } from "jose";
import { getKeyId, getPrivateKey } from "./jwks";
import crypto from "crypto";

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

    // Convert PEM to private key
    const privateKey = crypto.createPrivateKey(privateKeyPem);

    // Create unique JWT ID
    const jti = crypto.randomUUID();

    // Get current time and expiry
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 300; // 5 minutes

    // Determine the JWKS URL
    const jwksUrl = process.env.APP_HOSTNAME + "/.well-known/jwks.json";

    // Create payload
    const payload = {
      iss: clientId, // Issuer (your client ID)
      sub: clientId, // Subject (your client ID)
      aud: tokenEndpoint, // Audience (token endpoint URL)
      exp, // Expiration time
      jti, // Unique identifier
      iat: now, // Issued at time (adding this explicitly)
    };

    // Create and sign the JWT
    const jwt = await new SignJWT(payload)
      .setProtectedHeader({
        alg: "RS384", // Algorithm (ECDSA with SHA-384)
        typ: "JWT", // Type
        kid, // Key ID from your JWKS
        jku: jwksUrl, // JWK Set URL
      })
      .sign(privateKey);

    // Decode and log the JWT for debugging
    const decoded = decodeJwt(jwt);
    console.log("Created JWT:", {
      clientId,
      tokenEndpoint,
      jwksUrl,
      kid,
      decoded,
    });

    return jwt;
  } catch (error) {
    console.error("Error creating JWT:", error);
    throw new Error("Failed to create JWT");
  }
}

/**
 * Request an access token from a SMART on FHIR server
 * @param clientId - The client ID
 * @param tokenEndpoint - The token endpoint URL
 * @param scopes - The scopes to request
 * @returns The token response
 */
export async function requestSmartAccessToken(
  clientId: string,
  tokenEndpoint: string,
  scopes: string[],
) {
  // Create the JWT for client authentication
  const jwt = await createSmartJwt(clientId, tokenEndpoint);

  // Prepare the token request
  const formData = new URLSearchParams();
  formData.append("grant_type", "client_credentials");
  formData.append(
    "client_assertion_type",
    "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
  );
  formData.append("client_assertion", jwt);
  formData.append("scope", scopes.join(" "));

  // Send the request to the token endpoint
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token request failed: ${error}`);
  }

  return response.json();
}

/**
 * Utility to decode and inspect a JWT
 * @param jwt - The JWT to decode
 * @returns The decoded header and payload
 */
export function decodeJwt(jwt: string) {
  const parts = jwt.split(".");
  if (parts.length !== 3) {
    return { error: "Invalid JWT format" };
  }

  try {
    // Decode the header and payload
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());

    return { header, payload };
  } catch (e) {
    return { error: `Error decoding JWT: ${e}` };
  }
}
