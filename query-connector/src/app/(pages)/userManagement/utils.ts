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
  | "edit-user"
  | "remove-user"
  | "select-groups"
  | "create-group"
  | "add-members"
  | "add-queries"
  | "remove-group"
  | "closed";

type ModalMap = {
  [mode in UserManagementMode]: {
    heading: string;
    buttonText: string;
    prevStep?: UserManagementMode;
  };
};

export const ModalStates: ModalMap = {
  "create-user": {
    heading: "New user",
    buttonText: "Next: Add to user groups",
    prevStep: "closed",
  },
  "edit-user": {
    heading: "Edit user",
    buttonText: "Next: Edit user groups",
    prevStep: "closed",
  },
  "select-groups": {
    heading: "Add to user groups",
    buttonText: "Add User",
    prevStep: "create-user",
  },
  "create-group": {
    heading: "Create user group",
    buttonText: "Next: Assign members",
    prevStep: "closed",
  },
  "add-members": {
    heading: "TK",
    buttonText: "TK",
    prevStep: "create-group",
  },
  "add-queries": {
    heading: "TK",
    buttonText: "TK",
    prevStep: "add-members",
  },
  "remove-user": {
    heading: "TK",
    buttonText: "TK",
    prevStep: "closed",
  },
  "remove-group": {
    heading: "TK",
    buttonText: "TK",
    prevStep: "closed",
  },
  closed: {
    heading: "",
    buttonText: "",
    prevStep: "closed",
  },
};
