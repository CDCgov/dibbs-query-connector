import type { Profile } from "next-auth";
import { auditable } from "../audit-logs/decorator";

// Sign-in audit logging. This is called from the sign-in callback in
// src/auth.ts, where the profile isn't available until NextAuth redirects
// back to the application. This module must not be marked "use server":
// every export of such a module is a POST-able endpoint, and an ungated
// action here would let any caller write sign-in entries to the audit log.
class SignInAuditService {
  @auditable
  static async auditableSignIn(profile: Profile | undefined) {
    // just return since the log is happening within the decorator
    return profile;
  }
}

export const logSignInToAuditTable = SignInAuditService.auditableSignIn;
