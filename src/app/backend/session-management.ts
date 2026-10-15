"use server";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "@/auth";
import { auditable } from "./audit-logs/decorator";
import { auth } from "@/auth";
import type { Session } from "next-auth";

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
