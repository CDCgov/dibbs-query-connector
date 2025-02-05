import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { addUserIfNotExists } from "@/app/backend/user-management";

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
      if (profile) {
        const userToken = {
          id: profile.sub || "",
          username: profile.preferred_username || profile.email || "",
          email: profile.email || "",
          firstName: profile.given_name || "",
          lastName: profile.family_name || "",
        };

        // Ensure user is in the database **only on first login**
        try {
          await addUserIfNotExists(userToken);
        } catch (error) {}

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
      };
      return session;
    },
  },
  debug: true,
});
