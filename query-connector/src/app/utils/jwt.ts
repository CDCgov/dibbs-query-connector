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

    // Create a JWT that expires in 5 minutes (as required by SMART specs)
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 300; // 5 minutes

    // Create a unique JWT ID (jti)
    const jti = crypto.randomUUID();

    // Create and sign the JWT
    const jwt = await new SignJWT({
      iss: clientId, // Issuer (your client ID)
      sub: clientId, // Subject (your client ID)
      aud: tokenEndpoint, // Audience (token endpoint URL)
      exp, // Expiration time
      jti, // Unique identifier
    })
      .setProtectedHeader({
        alg: "ES384", // Algorithm (ECDSA with SHA-384)
        typ: "JWT", // Type
        kid, // Key ID from your JWKS
      })
      .sign(privateKey);

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
