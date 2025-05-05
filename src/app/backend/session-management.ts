"use server";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "@/auth";
import { auditable } from "./auditLogs/decorator";
import { auth } from "@/auth";
import type { Profile, Session } from "next-auth";

// Define types from the original functions
type NextAuthSignInParams = Parameters<typeof nextAuthSignIn>;
type NextAuthSignOutParams = Parameters<typeof nextAuthSignOut>;

class SessionManagementServiceAuditables {
  @auditable
  protected static async auditableSignOut(sessionParams: {
    args: NextAuthSignOutParams;
    session: Session | null;
  }) {
    return await nextAuthSignOut(...sessionParams.args);
  }

  @auditable
  static async auditableSignIn(profile: Profile | undefined) {
    // just return since the log is happening within the decorator
    return profile;
  }
}

class SessionManagementService extends SessionManagementServiceAuditables {
  static async signOut(...args: NextAuthSignOutParams) {
    const session = await auth();
    return super.auditableSignOut({
      args: args as NextAuthSignOutParams,
      session,
    });
  }

  static async signIn(...args: NextAuthSignInParams) {
    return await nextAuthSignIn(...args);
  }
}

export const signOut = SessionManagementService.signOut;
export const signIn = SessionManagementService.signIn;

// this is exported and then called within the auth.ts file directly in the sign in callback
// since the information we're interested in logging isn't available until NextAuth
// redirects back to the application. We tried the more straightforward option
// of awaiting / logging it here to follow the pattern in the rest of the application,
// but couldn't get it to work.
export const logSignInToAuditTable = SessionManagementService.auditableSignIn;
