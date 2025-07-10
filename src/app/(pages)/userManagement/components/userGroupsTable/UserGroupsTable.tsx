"use client";

import {
  createRef,
  Dispatch,
  RefObject,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
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
    setModalAction?: Dispatch<SetStateAction<string>>,
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
  const [modalAction, setModalAction] = useState<string>("");

  useEffect(() => {
    // return focus to groups tab after deleting a group
    if (modalAction == "remove-group") {
      tabFocusRef?.current?.focus();
    }
  }, [userGroups.length]);

  const { openEditSection } = useContext(UserManagementContext);
  const role = getRole();

  function getMemberLabel(memberSize: number): string {
    return memberSize == 1 ? `${memberSize} member` : `${memberSize} members`;
  }

  function getQueryLabel(querySize: number): string {
    return querySize == 1 ? `${querySize} query` : `${querySize} queries`;
  }

  function renderEditHoverButton(group: UserGroup, idx: number) {
    return (
      role === UserRole.SUPER_ADMIN && (
        <Button
          unstyled
          type="button"
          className={classNames(
            styles.hoverBtn,
            "unstyled-button-container",
            "usa-button--unstyled text-bold text-no-underline",
          )}
          onClick={() => {
            rowFocusRefs?.current?.[idx]?.current?.focus();
            openModal("edit-group", group);
          }}
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
              Rename
            </span>
          </span>
        </Button>
      )
    );
  }

  function renderDeleteHoverButton(group: UserGroup, idx: number) {
    return (
      role === UserRole.SUPER_ADMIN && (
        <Button
          unstyled
          type="button"
          className={classNames(
            styles.hoverBtn,
            "unstyled-button-container",
            "usa-button--unstyled text-bold text-no-underline destructive-primary",
          )}
          onClick={() => {
            // returns focus to row if modal is cxl'd;
            // returns focus to tab if delete confirmed
            rowFocusRefs?.current?.[idx]?.current?.focus();
            openModal("remove-group", group, setModalAction);
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
      )
    );
  }

  function renderGroupRows() {
    if (userGroups.length === 0) {
      return (
        <tr>
          <td>No user groups found</td>
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
          id={group.name}
        >
          <td>
            <div className={styles.buttonHoverGroup}>
              <span>{group.name}</span>
              {renderEditHoverButton(group, idx)}
            </div>
          </td>
          <td>
            {role == UserRole.SUPER_ADMIN ? (
              <Button
                className={classNames(
                  styles.drawerButton,
                  "margin-right-2",
                  "text-no-underline",
                )}
                type="button"
                unstyled
                key={group.id}
                aria-description={`Edit ${group.name} members`}
                data-testid={`edit-member-list-${idx}`}
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
            ) : (
              getMemberLabel(group.memberSize)
            )}
          </td>
          <td className="grid-col-2">
            <div className={styles.buttonHoverGroup}>
              <Button
                type="button"
                data-testid={`edit-query-list-${idx}`}
                className={classNames(styles.drawerButton, "text-no-underline")}
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
              {renderDeleteHoverButton(group, idx)}
            </div>
          </td>
        </tr>
      );
    });
  }

  return (
    <Table className={styles.userGroupsTable}>
      <thead>
        <tr>
          <th className="grid-col-5">Name</th>
          <th className="grid-col-3">Members</th>
          <th className="grid-col-4">Assigned queries</th>
        </tr>
      </thead>
      <tbody>{renderGroupRows()}</tbody>
    </Table>
  );
};

export default UserGroupsTable;
