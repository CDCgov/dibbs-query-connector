"use client";

import { createRef, RefObject, useContext, useEffect } from "react";
import classNames from "classnames";
import { Button } from "@trussworks/react-uswds";
import { Icon } from "@trussworks/react-uswds";
import Table from "../../../../ui/designSystem/table/Table";
import { UserManagementContext } from "../UserManagementProvider";
import { UserGroup, UserRole, User } from "../../../../models/entities/users";
import { CustomUserQuery } from "@/app/models/entities/query";
import styles from "../../userManagement.module.scss";
import { getRole } from "../../utils";

import { UserManagementMode } from "../../utils";

type UserGroupsTableProps = {
  userGroups: UserGroup[];
  fetchGroupMembers: (groupId: string) => Promise<User[]>;
  fetchGroupQueries: (groupId: string) => Promise<CustomUserQuery[]>;
  openModal: (
    mode: UserManagementMode,
    data?: UserGroup | User,
    ref?: RefObject<HTMLTableRowElement | null>,
  ) => void;
  rowFocusRefs?: RefObject<RefObject<HTMLTableRowElement | null>[]>;
  tabFocusRef?: RefObject<HTMLButtonElement | null>;
};

/**
 * User groups section in the user management page
 * @param root0 - The properties object
 * @param root0.userGroups The list of user groups to display
 * @param root0.fetchGroupMembers Function to retrieve a group's list of users
 * @param root0.fetchGroupQueries Function to retrieve a group's list of assigned queries
 * @param root0.openModal Function to retrieve a group's list of assigned queries
 * @param root0.rowFocusRefs ref array for the table row buttons that can open the user modal
 * @param root0.tabFocusRef ref array for the table row buttons that can open the user modal
 * @returns The user groups table
 */
const UserGroupsTable: React.FC<UserGroupsTableProps> = ({
  userGroups,
  fetchGroupQueries,
  fetchGroupMembers,
  openModal,
  rowFocusRefs,
  tabFocusRef,
}) => {
  useEffect(() => {
    tabFocusRef?.current?.focus();
  }, [userGroups]);

  const { openEditSection } = useContext(UserManagementContext);
  const role = getRole();

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

    return userGroups.map((group: UserGroup, idx: number) => {
      if (rowFocusRefs && rowFocusRefs.current) {
        rowFocusRefs.current[idx] = createRef();
      }

      return (
        <tr
          ref={rowFocusRefs?.current?.[idx]}
          tabIndex={0}
          key={group.id}
          className={styles.userGroupRow}
          id={group.name}
        >
          <td>{group.name}</td>
          <td>
            {role != UserRole.SUPER_ADMIN && group.memberSize <= 0 ? (
              getMemberLabel(group.memberSize)
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
                      members,
                    );
                  });
                }}
              >
                {getMemberLabel(group.memberSize)}
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
                  openEditSection(
                    group.name,
                    "Assigned Queries",
                    "Queries",
                    group.id,
                    groupQueries,
                  );
                });
              }}
            >
              {getQueryLabel(group.querySize)}
            </Button>
          </td>
          <td>
            {role === UserRole.SUPER_ADMIN ? (
              <div className={styles.actionButtons}>
                <Button
                  unstyled
                  type="button"
                  className={classNames(
                    styles.editBtn,
                    "unstyled-button-container",
                    "usa-button--unstyled text-bold text-no-underline",
                  )}
                  onClick={() =>
                    openModal("edit-group", group, rowFocusRefs?.current?.[idx])
                  }
                >
                  <span className="icon-text padding-right-4 display-flex flex-align-center">
                    <Icon.Edit
                      className="height-3 width-3"
                      aria-label="Pencil icon indicating edit ability"
                    />
                    <span
                      data-testid={`edit-group-${group.id}`}
                      className="padding-left-05"
                    >
                      Edit
                    </span>
                  </span>
                </Button>
                <Button
                  type="button"
                  className={classNames(
                    styles.deleteBtn,
                    "unstyled-button-container",
                    "usa-button--unstyled text-bold text-no-underline destructive-primary",
                  )}
                  onClick={() => {
                    // return focus to row if modal is cxl'd; to tab if delete confirmed
                    const rowRef = rowFocusRefs?.current?.[idx];
                    rowRef?.current
                      ? rowRef.current.focus()
                      : tabFocusRef?.current?.focus();

                    openModal("remove-group", group);
                  }}
                >
                  <span className="icon-text padding-right-4 display-flex flex-align-center">
                    <Icon.Delete
                      className="height-3 width-3"
                      aria-label="Trash icon indicating deletion of disease"
                    />
                    <span className="padding-left-05">Delete</span>
                  </span>
                </Button>
              </div>
            ) : (
              <div></div>
            )}
          </td>
        </tr>
      );
    });
  }

  return (
    <Table className={styles.userGroupsTable}>
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
