import { NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

/**
 * Validates the service token from the request headers.
 * @param req - The NextRequest object containing the request headers.
 * @returns An object indicating whether the token is valid and the payload if valid, or an error message if invalid.
 */
export async function validateServiceToken(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or invalid authorization header" };
  }

  const token = authHeader.substring(7);

  try {
    let keySetUrl: URL;
    switch (process.env.NEXT_PUBLIC_AUTH_PROVIDER) {
      // For Microsoft Entra
      case "microsoft-entra":
        keySetUrl = new URL(`${process.env.AUTH_ISSUER}/keys`);
        break;
      case "keycloak":
        keySetUrl = new URL(
          `${process.env.AUTH_ISSUER}/protocol/openid-connect/certs`,
        );
        break;
      default:
        return { valid: false, error: "Unsupported authentication provider" };
    }

    const JWKS = createRemoteJWKSet(keySetUrl);

    let { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.AUTH_ISSUER,
    });

    if (
      payload.azp !== process.env.AUTH_CLIENT_ID &&
      payload.client_id !== process.env.AUTH_CLIENT_ID
    ) {
      return { valid: false, error: "Invalid client" };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error };
  }
}
