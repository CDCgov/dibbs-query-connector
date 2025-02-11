import type { NextAuthConfig } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

//Follows pattern described in https://authjs.dev/getting-started/migrating-to-v5#edge-compatibility

function addRealm(url: string) {
  return url.endsWith("/realms/master") ? url : `${url}/realms/master`;
}

let { NAMED_KEYCLOAK, LOCAL_KEYCLOAK } = process.env;
if (!NAMED_KEYCLOAK || !LOCAL_KEYCLOAK) {
  const KEYCLOAK_URL =
    process.env.AUTH_KEYCLOAK_ISSUER || "http://localhost:8080";
  NAMED_KEYCLOAK = KEYCLOAK_URL;
  LOCAL_KEYCLOAK = KEYCLOAK_URL;
}

// Add /realms/master to the end of the URL if it's missing.
NAMED_KEYCLOAK = addRealm(NAMED_KEYCLOAK);
LOCAL_KEYCLOAK = addRealm(LOCAL_KEYCLOAK);

export default {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  basePath: "/api/auth",
  providers: [
    KeycloakProvider({
      jwks_endpoint: `${NAMED_KEYCLOAK}/protocol/openid-connect/certs`,
      wellKnown: undefined,
      clientId: process.env.AUTH_KEYCLOAK_ID,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
      issuer: `${LOCAL_KEYCLOAK}`,
      authorization: {
        params: {
          scope: "openid email profile",
        },
        url: `${LOCAL_KEYCLOAK}/protocol/openid-connect/auth`,
      },
      token: `${NAMED_KEYCLOAK}/protocol/openid-connect/token`,
      userinfo: `${NAMED_KEYCLOAK}/protocol/openid-connect/userinfo`,
    }),
  ],
} satisfies NextAuthConfig;
