import { auth } from "@/auth";
import { Session, User } from "next-auth";
import { getUserRole } from "../backend/user-management";
import { UserRole } from "../models/entities/users";
import { randomUUID } from "crypto";

/**
 * Checks if the property DEMO_MODE is true (Configured this way in demo env only)
 * @returns true if the application is running in demo env
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

/**
 * Checks if the property AUTH_DISABLED is true
 * USE ONLY ON FRONTEND COMPONENTS
 * @param runtimeConfig - object that contains all runtime variables
 * @returns true if auth is disabled for the application
 */
export function isAuthDisabledClientCheck(
  runtimeConfig: Record<string, string> | undefined,
): boolean {
  return runtimeConfig?.AUTH_DISABLED === "true";
}

/**
 * Checks if the property AUTH_DISABLED is true
 * USE ONLY ON SERVER CODE
 * @returns true if auth is disabled for the application
 */
export function isAuthDisabledServerCheck(): boolean {
  return process.env.AUTH_DISABLED === "true";
}

/**
 * Retrieves the logged in user. Will only contain the information retrieved from the IDP
 * @returns User object in the session or undefined if there is no active session
 */
export async function getLoggedInUser(): Promise<User | undefined> {
  const session = await auth();
  return session ? session.user : undefined;
}

/**
 * Performs super admin role check
 * @returns true if there is a session and the user has a super admin role
 */
export async function superAdminAccessCheck(): Promise<boolean> {
  const user = await getLoggedInUser();
  const role = await getUserRole(user?.username as string);

  return role === UserRole.SUPER_ADMIN || isAuthDisabledServerCheck();
}

/**
 * Performs admin role check
 * @returns true if there is a session and the user has a super admin OR admin role
 */
export async function adminAccessCheck(): Promise<boolean> {
  const user = await getLoggedInUser();
  const role = await getUserRole(user?.username as string);

  return (
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.ADMIN ||
    isAuthDisabledServerCheck()
  );
}

/**
 * Function return a predefined session object in cases where AUTH_DISABLED === true
 *
 * @returns A mock session object to use.
 */
export function returnPredefinedSessionObject() {
  console.log("Auth disabled. Returning predefined session token");
  const session: Session = {
    expires: "100000000",
  };
  session.user = {
    id: randomUUID(),
    email: "test-runner@dibbs.tools",
    username: "Test Runner",
    firstName: "Test",
    lastName: "Runner",
    role: UserRole.SUPER_ADMIN,
  };
  return session;
}
