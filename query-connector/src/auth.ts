import NextAuth from "next-auth";
import authConfig from "./auth.config";
import {
  addUserIfNotExists,
  getUserByUsername,
} from "@/app/backend/user-management";
import { isDemoMode } from "./app/utils/configChecks";
import { RoleTypeValues } from "./app/models/entities/user-management";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
        role: "Super Admin",
        emailVerified: null,
      };

      if (session.user.username) {
        if (isDemoMode()) {
          session.user.role = RoleTypeValues.SuperAdmin;
        } else {
          // swallow error and do not block sign in flow
          const user = await getUserByUsername(
            session.user.username as string,
          ).catch();
          session.user.role =
            user?.totalItems > 0 ? user.items?.[0].qc_role : "";
        }
      }

      return session;
    },
  },
  debug: true,
});
