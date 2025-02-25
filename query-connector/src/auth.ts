import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { addUserIfNotExists, getUserRole } from "@/app/backend/user-management";
import { isAuthDisabledServerCheck } from "./app/utils/auth";
import { RoleTypeValues } from "./app/models/entities/user-management";

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

export const { handlers, signIn, signOut, auth } = NextAuth({
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
  callbacks: {
    /**
     * JWT callback to store Keycloak user data in the token.
     * @param token The root object containing the JWT properties.
     * @param token.token The current JWT token.
     * @param token.profile The user profile returned from Keycloak.
     * @returns The updated JWT token with user details.
     */
    async jwt({ token, profile }) {
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

        if (userToken.username !== "") {
          if (isAuthDisabledServerCheck()) {
            userToken.role = RoleTypeValues.SuperAdmin;
          } else {
            const role = await getUserRole(
              userToken.username as string,
            ).catch();
            userToken.role = role;
          }
        }

        return { ...token, ...userToken };
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
        id: typeof token.id === "string" ? token.id : "",
        email: token.email || "",
        username: typeof token.username === "string" ? token.username : "",
        firstName: typeof token.firstName === "string" ? token.firstName : "",
        lastName: typeof token.lastName === "string" ? token.lastName : "",
        emailVerified: null,
        role: typeof token.role === "string" ? token.role : "",
      };
      return session;
    },
  },
  // WARNING: Turning this on will log out session info (which in all likelihood)
  // will contain PII into the system logs whenever users log in/out. Proceed
  // with caution
  debug: false,
});
