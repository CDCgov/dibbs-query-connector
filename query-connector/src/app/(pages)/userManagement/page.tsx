"use client";

import { useContext, useEffect, useState } from "react";
import { Button } from "@trussworks/react-uswds";
import classNames from "classnames";
import { getUsers, updateUserRole } from "@/app/backend/user-management";
import { QCResponse } from "@/app/models/responses/collections";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import WithAuth from "@/app/ui/components/withAuth/WithAuth";
import Table from "../../ui/designSystem/table/Table";
import RoleDropdown from "./components/RoleDropdown";
import { UserManagementContext } from "./components/UserManagementProvider";
import {
  RoleTypeValues,
  User,
  UserGroup,
} from "../../models/entities/user-management";
import { PAGES, pagesRoleAccess } from "@/app/ui/components/header/header";

/**
 * User section in the user management page
 * @returns Users table
 */
const UserManagement: React.FC = () => {
  const { openEditSection } = useContext(UserManagementContext);
  const [users, setUsers] = useState<User[] | null>(null);

  /**
   * Initialization
   */

  async function fetchUsers() {
    try {
      const userList: QCResponse<User> = await getUsers();
      setUsers(userList.items ?? []);
    } catch (e) {
      showToastConfirmation({
        body: "Unable to retrieve users. Please try again.",
        variant: "error",
      });
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Role update
   */

  async function handleUserRoleChange(username: string, role: RoleTypeValues) {
    try {
      await updateUserRole("", username, role);
      showToastConfirmation({
        body: "Role successfully updated.",
      });
    } catch (e) {
      showToastConfirmation({
        body: "Unable to update the user role. Please try again.",
        variant: "error",
      });
    }
  }

  /**
   * DOM helpers
   */

  function renderUserRows(users: User[] | null): React.ReactNode {
    if (users == null) {
      return (
        <tr>
          <td colSpan={3}>Loading...</td>
        </tr>
      );
    } else if (users.length == 0) {
      return (
        <tr>
          <td colSpan={3}>No users found</td>
        </tr>
      );
    } else {
      return users.map((user: User) => (
        <tr key={user.username}>
          <td>{`${user.last_name}, ${user.first_name}`}</td>
          <td width={270}>
            <RoleDropdown
              id={user.username}
              defaultValue={user.qc_role}
              OnChange={(role: RoleTypeValues) => {
                handleUserRoleChange(user.username, role);
              }}
            />
          </td>
          <td>
            {user.userGroups && user.userGroups?.length > 0
              ? user.userGroups?.map((group: UserGroup, idx: number) => (
                  <Button
                    className={classNames(
                      "margin-right-2",
                      "text-no-underline",
                    )}
                    type="button"
                    unstyled
                    key={group.id}
                    aria-description={`Edit ${group.name} members`}
                    onClick={() => {
                      openEditSection(
                        group.name,
                        "Members",
                        "Members",
                        group.id,
                      );
                    }}
                  >
                    {group.name}
                    {idx + 1 != user.userGroups?.length && ","}
                  </Button>
                ))
              : "--"}
          </td>
        </tr>
      ));
    }
  }

  /**
   * HTML
   */
  return (
    <WithAuth access={pagesRoleAccess[PAGES.USER_MANAGEMENT]}>
      <div
        className={classNames(
          "margin-x-3",
          "margin-y-4",
          "grid-row",
          "flex-row",
          "flex-no-wrap",
          "flex-justify",
        )}
        aria-description="Available user roles"
      >
        <p className={classNames("grid-col-4")}>
          <span className={classNames("text-bold")}>Super Admin:</span> Manage
          user permissions; create and manage user groups; view audit logs;
          configure FHIR servers; create, assign, and run queries
        </p>
        <p className={classNames("grid-col-4")}>
          <span className={classNames("text-bold")}>Admin:</span> Create,
          assign, and run queries
        </p>
        <p className={classNames("grid-col-3")}>
          <span className={classNames("text-bold")}>Standard:</span> Only run
          queries
        </p>
      </div>
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Permissions</th>
            <th>User groups</th>
          </tr>
        </thead>
        <tbody>{renderUserRows(users)}</tbody>
      </Table>
    </WithAuth>
  );
};

export default UserManagement;
