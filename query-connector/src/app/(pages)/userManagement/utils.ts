import { useSession } from "next-auth/react";

/**
 * Function that retrieves the role value from the current session object
 * @returns - The UserRole for the current logged-in user
 */
export function getSessionRole() {
  const { data: session } = useSession();
  return session?.user?.role;
}

export const RoleDescriptons = {
  "Super Admin":
    "Manage user permissions; create and manage user groups; view audit logs; configure FHIR servers; create, assign, and run queries",
  Admin: "Create, assign, and run queries",
  Standard: "Only run queries",
};

export type UserManagementMode =
  | "create-user"
  | "remove-user"
  | "select-groups"
  | "create-group"
  | "add-members"
  | "add-queries"
  | "remove-group"
  | "closed";
