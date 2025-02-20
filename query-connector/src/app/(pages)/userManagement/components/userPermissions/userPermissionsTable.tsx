"use client";

import { useContext } from "react";
import { Button } from "@trussworks/react-uswds";
import classNames from "classnames";
import { updateUserRole } from "@/app/backend/user-management";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import Table from "../../../../ui/designSystem/table/Table";
import RoleDropdown from "../roleDropdown/RoleDropdown";
import { UserManagementContext } from "../UserManagementProvider";
import { User, UserGroup } from "../../../../models/entities/user-management";
import { UserRole } from "../../../../models/entities/user-management";
import styles from "../../userManagement.module.scss";
type PermissionsProps = {
  users: User[] | null;
};
/**
 * User section in the user management page
 * @param root0 - The user groups table
 * @param root0.users The user groups table
 * @returns Users table
 */
const UserPermissionsTable: React.FC<PermissionsProps> = ({ users }) => {
  const { openEditSection } = useContext(UserManagementContext);

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

  const renderDropdown = (user: User) => {
    return (
      <td className={styles.roleDropdown} width={270}>
        <RoleDropdown
          id={user.id}
          defaultValue={user.qc_role}
          OnChange={(role: UserRole) => {
            handleUserRoleChange(user.id, role);
          }}
        />
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
                  onClick={() => {
                    openEditSection(group.name, "Members", "Members", group.id);
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
    return users?.map((user: User) => {
      return (
        <tr key={user.id}>
          <td width={270}>{`${user.last_name}, ${user.first_name}`}</td>
          {renderDropdown(user)}
          {renderGroups(user)}
        </tr>
      );
    });
  };

  /**
   * HTML
   */
  return (
    <>
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
    </>
  );
};

export default UserPermissionsTable;
