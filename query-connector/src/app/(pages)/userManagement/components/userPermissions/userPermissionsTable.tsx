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
import {
  UserRole,
  User,
  UserGroupMembership,
} from "@/app/models/entities/users";

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
      <td key={user.id}>
        {user?.userGroupMemberships && user.userGroupMemberships?.length > 0
          ? user.userGroupMemberships?.map(
              (membership: UserGroupMembership, idx: number) => {
                return (
                  <Button
                    className={classNames(
                      "margin-right-2",
                      "text-no-underline",
                    )}
                    type="button"
                    unstyled
                    key={membership.usergroup_id}
                    aria-description={`Edit ${membership.usergroup_name} members`}
                    onClick={async () => {
                      await fetchGroupMembers(membership.usergroup_id).then(
                        (members) =>
                          openEditSection(
                            membership.usergroup_name,
                            "Members",
                            "Members",
                            membership.usergroup_id,
                            members,
                          ),
                      );
                    }}
                  >
                    {membership.usergroup_name}
                    {idx + 1 != user.userGroupMemberships?.length && ","}
                  </Button>
                );
              },
            )
          : "--"}
      </td>
    );
  };

  const renderUserRows = (users: User[] | null): React.ReactNode => {
    return users?.map((user: User) => {
      const display =
        user.first_name && user.last_name
          ? `${user.last_name}, ${user.first_name} ${
              isSelf(user) ? "(self)" : ""
            }`
          : `${user.username}`;

      return (
        <tr key={user.id}>
          <td width={270}>{display}</td>
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
