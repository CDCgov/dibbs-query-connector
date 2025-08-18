import { JWTPayload, createRemoteJWKSet, jwtVerify } from "jose";
import { NextRequest } from "next/server";

interface EntraJWTPayload extends JWTPayload {
  roles?: string[];
}

interface KeycloakJWTPayload extends JWTPayload {
  resource_access?: {
    [key: string]: {
      roles?: string[];
    };
  };
}

/**
 * Validates the service token from the Authorization header of the request.
 * @param req - The NextRequest object containing the Authorization header
 * @returns - An object indicating whether the token is valid and the decoded payload if valid, or an error message if invalid.
 */
export async function validateServiceToken(req: NextRequest) {
  if (process.env.AUTH_DISABLED?.toLowerCase() === "true")
    return { valid: true };

  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or invalid authorization header" };
  }

  const token = authHeader.substring(7);

  try {
    let keySetUrl: URL;
    let issuer: string | undefined;
    let isKeycloak = false;

    switch (process.env.NEXT_PUBLIC_AUTH_PROVIDER) {
      case "microsoft-entra-id":
        keySetUrl = new URL(
          "https://login.microsoftonline.com/common/discovery/keys",
        );
        issuer = `https://sts.windows.net/${process.env.ENTRA_TENANT_ID}/`;
        break;
      case "keycloak":
        keySetUrl = new URL(
          `${process.env.AUTH_ISSUER}/protocol/openid-connect/certs`,
        );
        issuer = process.env.AUTH_ISSUER;
        isKeycloak = true;
        break;
      default:
        return { valid: false, error: "Unsupported authentication provider" };
    }

    const JWKS = createRemoteJWKSet(keySetUrl);

    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
    });

    // Check roles based on provider
    if (isKeycloak) {
      const keycloakPayload = payload as KeycloakJWTPayload;
      if (
        process.env.AUTH_CLIENT_ID &&
        keycloakPayload.aud?.includes(process.env.AUTH_CLIENT_ID) &&
        keycloakPayload.resource_access?.[
          process.env.AUTH_CLIENT_ID
        ]?.roles?.includes("api-user")
      ) {
        return { valid: true, payload };
      }
    } else {
      const entraPayload = payload as EntraJWTPayload;
      if (
        process.env.AUTH_CLIENT_ID &&
        (entraPayload.aud === process.env.AUTH_CLIENT_ID ||
          entraPayload.aud === `api://${process.env.AUTH_CLIENT_ID}`) &&
        entraPayload.roles?.includes("api-user")
      ) {
        return { valid: true, payload };
      }
    }

    return { valid: false, error: "Invalid audience or role" };
  } catch (error) {
    return { valid: false, error };
  }
}
