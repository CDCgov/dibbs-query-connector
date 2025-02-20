"use client";

import { useContext } from "react";
import { Button } from "@trussworks/react-uswds";
import classNames from "classnames";
import { updateUserRole } from "@/app/backend/user-management";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import Table from "../../../../ui/designSystem/table/Table";
import RoleDropdown from "../roleDropdown/RoleDropdown";
import { UserManagementContext } from "../UserManagementProvider";
import styles from "../../userManagement.module.scss";
import { useSession } from "next-auth/react";
import { UserRole, UserGroup, User } from "@/app/models/entities/users";

type PermissionsProps = {
  users: User[] | null;
  fetchGroupMembers: (groupId: string) => Promise<User[]>;
};

/**
 * User section in the user management page
 * @param root0 - The user groups table
 * @param root0.users The user groups table
 *  @param root0.fetchGroupMembers Function to retrieve a group's list of users
 * @returns Users table
 */
const UserPermissionsTable: React.FC<PermissionsProps> = ({
  users,
  fetchGroupMembers,
}) => {
  const { openEditSection } = useContext(UserManagementContext);

  const { data: session } = useSession();
  /**
   * Role update
   */

  async function handleUserRoleChange(id: string, role: UserRole) {
    try {
      await updateUserRole(id, role);
      showToastConfirmation({
        body: "Role successfully updated.",
      });
    } catch (e) {
      showToastConfirmation({
        body: "Unable to update the user role. Please try again.",
        variant: "error",
      });
      throw e;
    }
  }

  function isSelf(user: User): boolean {
    return user.username === session?.user?.username;
  }

  const renderDropdown = (user: User) => {
    return (
      <td className={styles.roleDropdown} width={270}>
        {isSelf(user) ? (
          user.qc_role
        ) : (
          <RoleDropdown
            id={user.id}
            defaultValue={user.qc_role}
            OnChange={(role: UserRole) => {
              handleUserRoleChange(user.id, role);
            }}
          />
        )}
      </td>
    );
  };

  const renderGroups = (user: User) => {
    return (
      <td>
        {user.user_groups && user.user_groups?.length > 0
          ? user.user_groups?.map((group: UserGroup, idx: number) => {
              return (
                <Button
                  className={classNames("margin-right-2", "text-no-underline")}
                  type="button"
                  unstyled
                  key={group.id}
                  aria-description={`Edit ${group.name} members`}
                  onClick={async () => {
                    let members = group.members;
                    if (!members || members?.length <= 0) {
                      members = await fetchGroupMembers(group.id);
                    }
                    openEditSection(
                      group.name,
                      "Members",
                      "Members",
                      group.id,
                      members as User[],
                    );
                  }}
                >
                  {group.name}
                  {idx + 1 != user.user_groups?.length && ","}
                </Button>
              );
            })
          : "--"}
      </td>
    );
  };

  const renderUserRows = (users: User[] | null): React.ReactNode => {
    if (users?.length == 0) {
      return (
        <tr>
          <td colSpan={3}>No users found</td>
        </tr>
      );
    }

    return users?.map((user: User) => {
      return (
        <tr key={user.id}>
          <td width={270}>{`${user.last_name}, ${user.first_name} ${
            isSelf(user) ? "(self)" : ""
          }
          `}</td>
          {renderDropdown(user)}
          {renderGroups(user)}
        </tr>
      );
    });
  };

  return (
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
  );
};

export default UserPermissionsTable;
