import KeycloakProvider from "next-auth/providers/keycloak";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { addUserIfNotExists } from "@/app/backend/user-management";
import NextAuth from "next-auth";
import { logSignInToAuditTable } from "./app/backend/session-management";
import {
  AuthContext,
  AuthStrategy,
  KeycloakAuthStrategy,
  MicrosoftEntraAuthStrategy,
} from "./app/backend/auth/lib";

let providers = [];
let authStrategy: AuthStrategy;

switch (process.env.NEXT_PUBLIC_AUTH_PROVIDER) {
  case "keycloak":
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

    providers = [
      KeycloakProvider({
        jwks_endpoint: `${NAMED_KEYCLOAK}/protocol/openid-connect/certs`,
        wellKnown: undefined,
        clientId: process.env.AUTH_CLIENT_ID,
        clientSecret: process.env.AUTH_CLIENT_SECRET,
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
    ];
    authStrategy = new KeycloakAuthStrategy();
    break;
  case "microsoft-entra-id":
    providers = [
      MicrosoftEntraID({
        clientId: process.env.AUTH_CLIENT_ID,
        clientSecret: process.env.AUTH_CLIENT_SECRET,
        issuer: process.env.AUTH_ISSUER,
        authorization: {
          params: {
            scope: "openid email profile",

            claims: {
              userinfo: {
                given_name: { essential: true },
                family_name: { essential: true },
                email: { essential: true },
              },
              id_token: {
                roles: { essential: true },
              },
            },
          },
        },
      }),
    ];
    authStrategy = new MicrosoftEntraAuthStrategy();
    break;
  default:
    throw Error(
      "Configured IdP doesn't match existing options. Please check the setup in your environment settings",
    );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  basePath: "/api/auth",
  providers,
  callbacks: {
    async jwt({ token, profile, account }) {
      const authContext = new AuthContext(authStrategy);

      let extendedToken = authContext.extendTokenWithExpirationTime(token);
      // IdP response doesn't have extra user token info (ie after initial sign in).
      // Just return token with extended expiry info
      if (!account || !profile) {
        return extendedToken;
      }

      const userToken = authContext.parseIdpResponseForUserToken(
        account,
        profile,
      );

      try {
        await addUserIfNotExists(userToken);
      } catch (error) {
        console.error(
          "Something went wrong in user setup after JWT generation",
          error,
        );
      }

      extendedToken = authContext.extendTokenWithUserInfo(token, userToken);

      return extendedToken;
    },

    /**
     * Session callback to pass user data to the session object.
     * @param session The root object containing session properties.
     * @param session.session The session object.
     * @param session.token The JWT token containing user data.
     * @returns The updated session object with user details.
     */
    async session({ session, token }) {
      session.user = {
        id: token.id || "",
        email: token.email || "",
        username: token.username || "",
        firstName: token.firstName || "",
        lastName: token.lastName || "",
        emailVerified: null,
        role: token.role || "",
      };

      session.expiresIn = token.expiresIn;

      return session;
    },

    async signIn({ profile }) {
      logSignInToAuditTable(profile);
      return true;
    },
  },
  // WARNING: Turning this on will log out session info (which in all likelihood)
  // will contain PII into the system logs whenever users log in/out. Proceed
  // with caution
  debug: false,
});
