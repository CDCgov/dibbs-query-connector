import { auth } from "@/auth";
import { User } from "next-auth";
import { getUserRole } from "../backend/user-management";
import { RoleTypeValues } from "../models/entities/user-management";

/**
 * Checks if the property DEMO_MODE is true (Configured this way in demo env only)
 * @returns true if the application is running in demo env
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

/**
 * Checks if the property AUTH_DISABLED is true
 * @returns true if auth is disabled for the application
 */
export function isAuthDisabled(): boolean {
  return process.env.AUTH_DISABLED === "true";
}

/**
 * Retrieves the logged user. Will only contain the information retrieved from the IDP
 * @returns User object in the session or undefined if there is no active session
 */
export async function getLoggedUser(): Promise<User | undefined> {
  const session = await auth();

  return session ? session.user : undefined;
}

/**
 * Performs super admin role check
 * @returns true if there is an session and the user has a super admin role
 */
export async function superAdminAccessCheck(): Promise<boolean> {
  const user = await getLoggedUser();

  if (
    isAuthDisabled() ||
    (user &&
      (await getUserRole(user.username as string)) ===
        RoleTypeValues.SuperAdmin)
  ) {
    return true;
  }
  return false;
}
