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
});
