import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  basePath: "/api/auth",
  providers: [
    KeycloakProvider({
      jwks_endpoint: `${process.env.NAMED_KEYCLOAK}/realms/master/protocol/openid-connect/certs`,
      wellKnown: undefined,
      clientId: process.env.AUTH_KEYCLOAK_ID,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
      issuer: `${process.env.LOCAL_KEYCLOAK}/realms/master`,
      authorization: {
        params: {
          scope: "openid email profile",
        },
        url: `${process.env.LOCAL_KEYCLOAK}/realms/master/protocol/openid-connect/auth`,
      },
      token: `${process.env.NAMED_KEYCLOAK}/realms/master/protocol/openid-connect/token`,
      userinfo: `${process.env.NAMED_KEYCLOAK}/realms/master/protocol/openid-connect/userinfo`,
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
