import { useSession } from "next-auth/react";

/**
 * Function that retrieves the role value from the current session object
 * @returns - The UserRole for the current logged-in user
 */
export function getSessionRole() {
  const { data: session } = useSession();
  return session?.user?.role;
}
