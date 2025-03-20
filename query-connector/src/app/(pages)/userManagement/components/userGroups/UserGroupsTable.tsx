"use client";

import { useContext, useEffect, useState } from "react";
import classNames from "classnames";
import { Button } from "@trussworks/react-uswds";

import Table from "../../../../ui/designSystem/table/Table";
import { UserManagementContext } from "../UserManagementProvider";
import {
  UserGroup,
  UserRole,
  User,
  UserGroupMembership,
} from "../../../../models/entities/users";
import { CustomUserQuery } from "@/app/models/entities/query";
import styles from "../usersTable/usersTable.module.scss";
import { getContextRole } from "../../utils";
import { getCustomQueries } from "@/app/backend/query-building";

type UserGroupsTableProps = {
  userGroups: UserGroup[];
  fetchGroupMembers: (groupId: string) => Promise<User[]>;
  fetchGroupQueries: (groupId: string) => Promise<CustomUserQuery[]>;
};

/**
 * User groups section in the user management page
 * @param root0 - The properties object
 * @param root0.userGroups The list of user groups to display
 * @param root0.fetchGroupMembers Function to retrieve a group's list of users
 * @param root0.fetchGroupQueries Function to retrieve a group's list of assigned queries
 * @returns The user groups table
 */
const UserGroupsTable: React.FC<UserGroupsTableProps> = ({
  userGroups,
  fetchGroupQueries,
  fetchGroupMembers,
}) => {
  const { openEditSection } = useContext(UserManagementContext);
  const role = getContextRole();

  const [queries, setQueries] = useState<CustomUserQuery[]>([]);

  useEffect(() => {
    async function fetchAllQueries() {
      const queriesResponse = await getCustomQueries();
      setQueries(queriesResponse);
    }
    fetchAllQueries();
  }, []);

  function getMemberLabel(memberSize: number): string {
    return memberSize == 1 ? `${memberSize} member` : `${memberSize} members`;
  }

  function getQueryLabel(querySize: number): string {
    return querySize == 1 ? `${querySize} query` : `${querySize} queries`;
  }

  function renderGroupsTable() {
    if (userGroups.length === 0) {
      return (
        <tr>
          <td colSpan={3}>No user groups found</td>
        </tr>
      );
    }

    function addGroupAssignments(
      query: CustomUserQuery,
      group: UserGroup,
      groupQueries: CustomUserQuery[],
    ) {
      let memberships: UserGroupMembership[] = [];

      groupQueries.forEach((gq) => {
        if (gq.query_id == query.query_id) {
          const membership = {
            membership_id:
              gq.groupAssignments?.find((g) => g.membership_id)
                ?.membership_id || "",
            usergroup_id: group.id,
            usergroup_name: group.name,
            is_member: true,
          };
          memberships.push(membership);
        }
      });
      query.groupAssignments = memberships;
    }

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
                await fetchGroupMembers(group.id).then((members) => {
                  openEditSection(
                    group.name,
                    "Members",
                    "Members",
                    group.id,
                    members as User[],
                  );
                });
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
              await fetchGroupQueries(group.id).then((groupQueries) => {
                queries.forEach((query) =>
                  addGroupAssignments(query, group, groupQueries),
                );

                openEditSection(
                  group.name,
                  "Assigned Queries",
                  "Queries",
                  group.id,
                  queries,
                );
              });
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
      <tbody>{renderGroupsTable()}</tbody>
    </Table>
  );
};

export default UserGroupsTable;
