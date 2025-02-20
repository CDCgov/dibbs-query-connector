"use client";

import { useContext } from "react";
import classNames from "classnames";
import { Button } from "@trussworks/react-uswds";
import Table from "../../../../ui/designSystem/table/Table";

import { UserManagementContext } from "../UserManagementProvider";
import { User, UserGroup } from "../../../../models/entities/user-management";

type GroupProps = {
  users: User[];
  userGroups: UserGroup[];
  setUserGroups: (foo: UserGroup[]) => void;
};
/**
 * User groups section in the user management page
 * @param root0 - The user groups table
 * @param root0.users The user groups table
 * @param root0.userGroups The user groups table
 * @param root0.setUserGroups The user groups table
 * @returns The user groups table
 */
const UserGroupsTable: React.FC<GroupProps> = ({
  users,
  userGroups,
  setUserGroups,
}) => {
  const { openEditSection } = useContext(UserManagementContext);

  function getMemberLabel(memberSize: number): string {
    return memberSize == 1 ? `${memberSize} member` : `${memberSize} members`;
  }

  function getQueryLabel(querySize: number): string {
    return querySize == 1 ? `${querySize} query` : `${querySize} queries`;
  }

  /**
   * HTML
   */
  return (
    <Table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Members</th>
          <th>Assigned queries</th>
        </tr>
      </thead>
      <tbody>
        {userGroups.map((group: UserGroup) => (
          <tr key={group.id}>
            <td width={270}>{group.name}</td>
            <td>
              <Button
                type="button"
                className={classNames("text-no-underline")}
                unstyled
                aria-description={`Edit ${group.name} members`}
                onClick={() => {
                  openEditSection(group.name, "Members", "Members", group.id);
                }}
              >
                {getMemberLabel(group.member_size)}
              </Button>
            </td>
            <td>
              <Button
                type="button"
                className={classNames("text-no-underline")}
                unstyled
                aria-description={`Edit ${group.name} queries`}
                onClick={() => {
                  openEditSection(
                    group.name,
                    "Assigned queries",
                    "Query",
                    group.id,
                  );
                }}
              >
                {getQueryLabel(group.query_size)}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default UserGroupsTable;
