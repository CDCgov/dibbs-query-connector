import KeycloakProvider from "next-auth/providers/keycloak";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { addUserIfNotExists, getUserRole } from "@/app/backend/user-management";
import { isAuthDisabledServerCheck } from "./app/utils/auth";
import { UserRole } from "./app/models/entities/users";
import NextAuth from "next-auth";
import { logSignInToAuditTable } from "./app/backend/session-management";
import { decodeJwt } from "jose";
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

const keycloakProvider = KeycloakProvider({
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
});

const entraProvider = MicrosoftEntraID({
  clientId: process.env.AUTH_CLIENT_ID,
  clientSecret: process.env.AUTH_CLIENT_SECRET,
  issuer: process.env.AUTH_ISSUER,
  authorization: {
    params: {
      scope: "openid email profile",
    },
  },
});

let providers = [];

switch (process.env.NEXT_PUBLIC_AUTH_PROVIDER) {
  case "keycloak":
    providers = [keycloakProvider];
    break;
  case "microsoft-entra-id":
    providers = [entraProvider];
    break;
  default:
    providers = [keycloakProvider];
    break;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  basePath: "/api/auth",
  providers,
  callbacks: {
    /**
     * JWT callback to store Keycloak user data in the token.
     * @param token The root object containing the JWT properties.
     * @param token.token The current JWT token.
     * @param token.profile The user profile returned from Keycloak.
     * @returns The updated JWT token with user details.
     */
    async jwt({ token, profile, account }) {
      const now = Math.floor(Date.now() / 1000);
      if (account?.access_token) {
        let decodedToken = decodeJwt(account?.access_token);
        console.log(decodedToken);
        if (
          decodedToken &&
          typeof decodedToken !== "string" &&
          decodedToken?.realm_access
        ) {
          // keycloak
          const roles = decodedToken?.realm_access as Record<string, string>;
          console.log("Includes admin: ", roles?.roles?.includes("admin"));
        }
      }

      if (profile) {
        const userToken = {
          id: profile.sub || "",
          username: profile.preferred_username || profile.email || "",
          email: profile.email || "",
          firstName: profile.given_name || "",
          lastName: profile.family_name || "",
          role: "",
        };

        // Ensure user is in the database **only on first login**
        try {
          await addUserIfNotExists(userToken);
        } catch (error) {
          console.error("Something went wrong in generating user token", error);
        }

        token = { ...token, ...userToken };
      }

      // Extend token with role and time to expire
      if (token.username && token.username !== "") {
        if (isAuthDisabledServerCheck()) {
          token.role = UserRole.SUPER_ADMIN;
        } else {
          const role = await getUserRole(token.username).catch();
          token.role = role;
        }
      }

      if (token.exp) {
        token.expiresIn = token.exp - now;
      }

      // handle expired tokens
      if (token.expiresIn && token.expiresIn <= 0) {
        return null;
      }

      return token;
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
