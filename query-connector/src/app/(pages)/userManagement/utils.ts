import { useSession } from "next-auth/react";
import { useContext } from "react";
import { DataContext } from "@/app/shared/DataProvider";
import { isAuthDisabledClientCheck } from "@/app/utils/auth";
import { UserRole } from "@/app/models/entities/users";

/**
 * Function that retrieves the role value from the current session object
 * @returns - The UserRole for the current logged-in user
 */
export function getRole() {
  const { data: session } = useSession();
  const ctx = useContext(DataContext);
  const isAuthDisabled = isAuthDisabledClientCheck(ctx?.runtimeConfig);

  return isAuthDisabled ? UserRole.SUPER_ADMIN : session?.user.role;
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
    secondaryBtnText: string;
    prevStep?: UserManagementMode;
  };
};

export const ModalStates: ModalMap = {
  "create-user": {
    heading: "New user",
    buttonText: "Next: Add to user groups",
    secondaryBtnText: "",
    prevStep: "closed",
  },
  "edit-user": {
    heading: "Edit user",
    buttonText: "Next: Edit user groups",
    secondaryBtnText: "",
    prevStep: "closed",
  },
  "select-groups": {
    heading: "Add to user groups",
    buttonText: "Add User",
    secondaryBtnText: "Back",
    prevStep: "create-user",
  },
  "create-group": {
    heading: "Create user group",
    buttonText: "Next: Assign members",
    secondaryBtnText: "Cancel",
    prevStep: "closed",
  },
  "add-members": {
    heading: "Add members",
    buttonText: "",
    secondaryBtnText: "Next: Add to user groups",
    prevStep: "create-group",
  },
  "add-queries": {
    heading: "TK",
    buttonText: "TK",
    secondaryBtnText: "Next: Add to user groups",
    prevStep: "add-members",
  },
  "remove-user": {
    heading: "TK",
    buttonText: "TK",
    secondaryBtnText: "Next: Add to user groups",
    prevStep: "closed",
  },
  "remove-group": {
    heading: "TK",
    buttonText: "TK",
    secondaryBtnText: "Next: Add to user groups",
    prevStep: "closed",
  },
  closed: {
    heading: "",
    buttonText: "",
    secondaryBtnText: "Next: Add to user groups",
    prevStep: "closed",
  },
};
