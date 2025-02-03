import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

function addRealm(url: string) {
  return url.endsWith("/realms/master") ? url : `${url}/realms/master`;
}

let { NAMED_KEYCLOAK, LOCAL_KEYCLOAK } = process.env;
if (!NAMED_KEYCLOAK || !LOCAL_KEYCLOAK) {
  const KEYCLOAK_URL = process.env.AUTH_KEYCLOAK_ISSUER;
  // Check if undefined or empty string.
  if (!KEYCLOAK_URL) {
    throw new Error(
      "AUTH_KEYCLOAK_ISSUER is missing. Please provide a valid Keycloak URL.",
    );
  }
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
  redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
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
      console.log("JWT Callback - Initial Token:", token);
      console.log("JWT Callback - Profile:", profile);

      if (profile) {
        token.id = profile.sub;
        token.username = profile.preferred_username || profile.email;
        token.email = profile.email;
        token.firstName = profile.given_name;
        token.lastName = profile.family_name;
      }

      console.log("JWT Callback - Final Token:", token);
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
      console.log("Session Callback - Initial Session:", session);
      console.log("Session Callback - Token:", token);

      session.user = {
        ...token,
        id: typeof token.id === "string" ? token.id : "",
        email: token.email || "",
        emailVerified: null,
      };

      console.log("Session Callback - Final Session:", session);
      return session;
    },
  },
  debug: true,
});
