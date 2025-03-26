"use client";
import { Dispatch, SetStateAction, useContext } from "react";
import classNames from "classnames";
import { Checkbox } from "@trussworks/react-uswds";
import Drawer from "@/app/ui/designSystem/drawer/Drawer";
import { UserManagementContext } from "../UserManagementProvider";
import style from "./TeamQueryEditSection.module.scss";
import { User, UserGroup, UserRole } from "@/app/models/entities/users";
import { getRole } from "../../utils";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import {
  getAllUserGroups,
  addUsersToGroup,
  removeUsersFromGroup,
  removeQueriesFromGroup,
  addQueriesToGroup,
} from "@/app/backend/usergroup-management";
import { CustomUserQuery } from "@/app/models/entities/query";
import { viewMode } from "../userManagementContainer/userManagementContainer";

export type UserManagementDrawerProps = {
  userGroups: UserGroup[];
  setUserGroups: Dispatch<SetStateAction<UserGroup[]>>;
  users: User[];
  setUsers: Dispatch<SetStateAction<User[]>>;
  refreshView: Dispatch<SetStateAction<boolean | viewMode>>;
  activeTabLabel: string;
  allQueries: CustomUserQuery[];
  setAllQueries: Dispatch<SetStateAction<CustomUserQuery[]>>;
};

/**
 * @param root0 - The properties object
 * @param root0.setUserGroups - State function that updates UserGroup data
 * @param root0.users The list of users to display
 * @param root0.setUsers - State function that updates User data
 * @param root0.allQueries The list of querires to display
 * @param root0.setAllQueries State function that updates CustomUserQuery data
 * @param root0.refreshView - State function that triggers a refresh of User or Group data
 * @param root0.activeTabLabel - The string label name of the active Tab
 * @returns TeamQueryEditSection component which is the collapsible section that allows to edit members and queries of a team
 */
const UserManagementDrawer: React.FC<UserManagementDrawerProps> = ({
  setUserGroups,
  users,
  setUsers,
  refreshView,
  activeTabLabel,
  allQueries,
  setAllQueries,
}) => {
  const { teamQueryEditSection, closeEditSection, handleSearch } = useContext(
    UserManagementContext,
  );

  const role = getRole();
  const renderQueries = (queries: CustomUserQuery[]) => {
    if (queries.length > 0) {
      return (
        <ul
          aria-description={`queries for ${teamQueryEditSection.title}`}
          className={classNames("usa-list--unstyled", "margin-top-2")}
        >
          {queries.map((query) => {
            const isAssignedToGroup = query.groupAssignments?.some((q) => {
              return q.is_member;
            });
            return (
              <li key={query.query_id}>
                <Checkbox
                  id={query.query_id}
                  name={query.query_name}
                  label={`${query.query_name}`}
                  defaultChecked={isAssignedToGroup}
                  onChange={handleToggleQuery}
                  className={classNames("margin-bottom-3", style.checkbox)}
                />
              </li>
            );
          })}
        </ul>
      );
    } else {
      return renderError("queries");
    }
  };

  const renderUsers = (users: User[]) => {
    if (users.length > 0) {
      return (
        <ul
          aria-description={`members of ${teamQueryEditSection.title}`}
          className={classNames("usa-list--unstyled", "margin-top-2")}
        >
          {users.map((user) => {
            const display =
              user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : `${user.username}`;

            const isMemberOfCurrentGroup = user.userGroupMemberships?.filter(
              (membership) =>
                membership?.usergroup_id == teamQueryEditSection?.groupId,
            )[0];

            return (
              <li key={user.id}>
                {role == UserRole.SUPER_ADMIN ? (
                  <Checkbox
                    id={user.id}
                    name={user.username}
                    label={display}
                    defaultChecked={!!isMemberOfCurrentGroup}
                    onChange={handleToggleMembership}
                    className={classNames("margin-bottom-3", style.checkbox)}
                  />
                ) : (
                  <div
                    key={user.id}
                    className={"padding-bottom-2"}
                  >{`${user.first_name} ${user.last_name}`}</div>
                )}
              </li>
            );
          })}
        </ul>
      );
    } else {
      return renderError("members");
    }
  };

  const renderError = (content: string) => {
    return <div>{`No ${content} assigned to this group.`}</div>;
  };

  function generateContent(): JSX.Element {
    const isMemberView = teamQueryEditSection.subjectType == "Members";
    return isMemberView
      ? renderUsers(users)
      : renderQueries(teamQueryEditSection.subjectData as CustomUserQuery[]);
  }

  async function handleToggleMembership(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const groupId = teamQueryEditSection.groupId;
    const groupName = teamQueryEditSection.title;
    const userName = e.currentTarget.labels?.[0].innerText;
    const userId = e.currentTarget.id;
    const checked = e.target.checked;

    const alertText = checked
      ? `Added ${userName} to ${groupName}`
      : `Removed ${userName} from ${groupName}`;

    try {
      const updatedUserResponse = !!checked
        ? await addUsersToGroup(groupId, [userId])
        : await removeUsersFromGroup(groupId, [userId]);

      if (updatedUserResponse.totalItems === 0) {
        throw "Unable to update group membership";
      }
      const updatedUserGroups = await getAllUserGroups();
      const updatedUser = updatedUserResponse.items[0];
      const newUsersList = users.map((u) => {
        if (u.id == userId) {
          u = updatedUser as User;
          return {
            ...u,
            ...{ userGroupMemberships: u?.userGroupMemberships },
          };
        } else {
          return u;
        }
      });

      setUsers(newUsersList);
      setUserGroups(updatedUserGroups.items); // for refreshing member count in table view
      refreshView(`Update ${activeTabLabel}` as viewMode);

      showToastConfirmation({
        body: alertText,
      });
    } catch {
      showToastConfirmation({
        heading: "Something went wrong",
        body: `Unable to update ${groupName} membership. Please try again or contact us if the error persists`,
        variant: "error",
      });
    }
  }

  async function handleToggleQuery(e: React.ChangeEvent<HTMLInputElement>) {
    const groupId = teamQueryEditSection.groupId;
    const groupName = teamQueryEditSection.title;
    const queryName = e.currentTarget.labels?.[0].innerText;
    const queryId = e.currentTarget.id;
    const checked = e.target.checked;

    const alertText = checked
      ? `Assigned ${queryName} to ${groupName}`
      : `Unassigned ${queryName} from ${groupName}`;

    try {
      const updatedQueryResponse = !!checked
        ? await addQueriesToGroup(groupId, [queryId])
        : await removeQueriesFromGroup(groupId, [queryId]);

      if (updatedQueryResponse.totalItems === 0) {
        throw "Unable to update query assignment";
      }

      const newQueriesList = allQueries.map((q) => {
        if (q.query_id == queryId) {
          const groupAssignments = q.groupAssignments || [];
          return {
            ...q,
            ...{ userGroupMemberships: groupAssignments },
          };
        } else {
          return q;
        }
      });

      const updatedUserGroups = await getAllUserGroups();

      setAllQueries(newQueriesList);
      setUserGroups(updatedUserGroups.items); // for refreshing query count in table view
      refreshView(`Update ${activeTabLabel}` as viewMode);
      showToastConfirmation({
        body: alertText,
      });
    } catch {
      showToastConfirmation({
        heading: "Something went wrong",
        body: `Unable to update group assignment for ${queryName}. Please try again or contact us if the error persists`,
        variant: "error",
      });
    }
  }
  return (
    <Drawer
      title={teamQueryEditSection.title}
      subtitle={teamQueryEditSection.subtitle}
      placeholder={teamQueryEditSection.placeholder}
      toRender={generateContent()}
      isOpen={teamQueryEditSection.isOpen}
      onSave={() => {}}
      onSearch={() => handleSearch}
      onClose={closeEditSection}
    />
  );
};

export default UserManagementDrawer;
