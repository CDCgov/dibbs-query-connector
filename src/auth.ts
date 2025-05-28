import { addUserIfNotExists } from "@/app/backend/user-management";
import NextAuth from "next-auth";
import { logSignInToAuditTable } from "./app/backend/session-management";
import {
  AuthContext,
  AuthStrategy,
  KeycloakAuthStrategy,
  MicrosoftEntraAuthStrategy,
} from "./app/backend/auth/lib";
import { UserRole } from "./app/models/entities/users";

let providers = [];
let authStrategy: AuthStrategy;

switch (process.env.NEXT_PUBLIC_AUTH_PROVIDER) {
  case "keycloak":
    authStrategy = new KeycloakAuthStrategy();
    const keycloakProvider = authStrategy.setUpNextAuthProvider();
    providers.push(keycloakProvider);
    break;
  case "microsoft-entra-id":
    authStrategy = new MicrosoftEntraAuthStrategy();
    const microsoftProvider = authStrategy.setUpNextAuthProvider();
    providers.push(microsoftProvider);
    break;
  default:
    console.error(
      "Configured IdP doesn't match existing options. Please check the setup in your environment settings",
    );
    console.error("Falling back to Keycloak setup");
    authStrategy = new KeycloakAuthStrategy();
    const fallbackProvider = authStrategy.setUpNextAuthProvider();
    providers.push(fallbackProvider);
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
        token,
        account,
        profile,
      );

      try {
        // force refresh in case something changed from the IdP
        await addUserIfNotExists(userToken, true);
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
        role: (token.qcRole as UserRole) || UserRole.STANDARD,
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
