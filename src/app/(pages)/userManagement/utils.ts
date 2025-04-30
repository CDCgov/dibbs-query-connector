import { useSession } from "next-auth/react";
import { useContext } from "react";
import { DataContext } from "@/app/shared/DataProvider";
import { isAuthDisabledClientCheck } from "@/app/utils/auth";
import { User, UserRole } from "@/app/models/entities/users";
import { CustomUserQuery } from "@/app/models/entities/query";

/**
 * Function that retrieves the role value from the current session object
 * @returns - The UserRole for the current logged-in user
 */
export function getRole() {
  const { data: session } = useSession();
  const ctx = useContext(DataContext);
  const isAuthDisabled = isAuthDisabledClientCheck(ctx?.runtimeConfig);
  return isAuthDisabled ? UserRole.SUPER_ADMIN : session?.user?.role;
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
  | "edit-group"
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
    secondaryBtnText: "Cancel",
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
  "edit-group": {
    heading: "Edit user group",
    buttonText: "Save & update members",
    secondaryBtnText: "Cancel",
    prevStep: "closed",
  },
  "remove-user": {
    heading: "Delete user?",
    buttonText: "Delete",
    secondaryBtnText: "Cancel",
    prevStep: "closed",
  },
  "remove-group": {
    heading: "Delete user group?",
    buttonText: "Delete",
    secondaryBtnText: "Cancel",
    prevStep: "closed",
  },
  closed: {
    heading: "",
    buttonText: "",
    secondaryBtnText: "",
    prevStep: "closed",
  },
};

export type FilterableUser = User & {
  render: boolean;
};

export type FilterableCustomUserQuery = CustomUserQuery & {
  render: boolean;
};

/**
 * A helper function to filter a list of users
 * @param searchFilter - the search string to filter against
 * @param users - the user list to filter
 * @returns a user with the appropriate render flag set for itself
 */
export function filterUsers(searchFilter: string, users: User[]) {
  const casedSearchFilter = searchFilter.toLocaleLowerCase();
  const newUsers = structuredClone(users);

  return newUsers.map((user) => {
    let fNameMatch = user.firstName
      .toLocaleLowerCase()
      .includes(casedSearchFilter);
    let lNameMatch = user.lastName
      .toLocaleLowerCase()
      .includes(casedSearchFilter);
    let uNameMatch = user.username
      .toLocaleLowerCase()
      .includes(casedSearchFilter);

    if (!fNameMatch && !lNameMatch && !uNameMatch) {
      return user;
    } else {
      let render = fNameMatch || lNameMatch || uNameMatch;
      return { ...user, render } as FilterableUser;
    }
  });
}

/**
 * A helper function to filter a list of queries
 * @param searchFilter - the search string to filter against
 * @param queries - the query list to filter
 * @returns a CustomUserQuery with the appropriate render flag set for itself
 */
export function filterQueries(
  searchFilter: string,
  queries: CustomUserQuery[],
) {
  const casedSearchFilter = searchFilter.toLocaleLowerCase();
  const newQueries = structuredClone(queries);

  return newQueries.map((query) => {
    let nameMatch = query?.queryName
      .toLocaleLowerCase()
      .includes(casedSearchFilter);

    if (!nameMatch) {
      return query;
    } else {
      let render = !!nameMatch;
      return { ...query, render } as FilterableCustomUserQuery;
    }
  });
}
