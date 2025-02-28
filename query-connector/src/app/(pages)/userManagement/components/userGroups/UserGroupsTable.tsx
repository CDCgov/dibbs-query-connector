"use client";

import { useContext } from "react";
import classNames from "classnames";
import { Button } from "@trussworks/react-uswds";

import Table from "../../../../ui/designSystem/table/Table";
import { UserManagementContext } from "../UserManagementProvider";
import {
  UserGroup,
  UserRole,
  User,
} from "../../../../models/entities/user-management";
import { QueryTableResult } from "@/app/(pages)/queryBuilding/utils";
import styles from "../usersTable/usersTable.module.scss";
import { getSessionRole } from "../../utils";

type UserGroupsTableProps = {
  userGroups: UserGroup[];
  fetchGroupMembers: (groupId: string) => Promise<User[]>;
  fetchGroupQueries: (groupId: string) => Promise<QueryTableResult[]>;
};

/**
 * User groups section in the user management page
 * @param root0 - The properties object
 * @param root0.userGroups The list of user groups to display
 *  @param root0.fetchGroupMembers Function to retrieve a group's list of users
 *  @param root0.fetchGroupQueries Function to retrieve a group's list of assigned queries
 * @returns The user groups table
 */
const UserGroupsTable: React.FC<UserGroupsTableProps> = ({
  userGroups,
  fetchGroupQueries,
  fetchGroupMembers,
}) => {
  const { openEditSection } = useContext(UserManagementContext);
  const role = getSessionRole();

  function getMemberLabel(memberSize: number): string {
    return memberSize == 1 ? `${memberSize} member` : `${memberSize} members`;
  }

  function getQueryLabel(querySize: number): string {
    return querySize == 1 ? `${querySize} query` : `${querySize} queries`;
  }

  function renderGroupsTable() {
    return userGroups.map((group: UserGroup, idx: number) => (
      <tr key={group.id}>
        <td width={270}>{group.name}</td>
        <td>
          {role != UserRole.SUPER_ADMIN && group.member_size <= 0 ? (
            getMemberLabel(group.member_size)
          ) : (
            <Button
              type="button"
              data-testid={`edit-member-list-${idx}`}
              className={classNames(styles.drawerButton, "text-no-underline")}
              unstyled
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
              {getMemberLabel(group.member_size)}
            </Button>
          )}
        </td>
        <td>
          <Button
            type="button"
            data-testid={`edit-query-list-${idx}`}
            className={classNames("text-no-underline")}
            unstyled
            aria-description={`Edit ${group.name} queries`}
            onClick={async () => {
              let queries = group.queries;
              if (!queries || queries?.length <= 0) {
                queries = await fetchGroupQueries(group.id);
              }
              openEditSection(
                group.name,
                "Assigned Queries",
                "Queries",
                group.id,
                queries as QueryTableResult[],
              );
            }}
          >
            {getQueryLabel(group.query_size)}
          </Button>
        </td>
      </tr>
    ));
  }
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
        {userGroups.length > 0 ? (
          renderGroupsTable()
        ) : (
          <tr key={0}>
            <td>{"No user groups found."}</td>
          </tr>
        )}
      </tbody>
    </Table>
  );
};

export default UserGroupsTable;
