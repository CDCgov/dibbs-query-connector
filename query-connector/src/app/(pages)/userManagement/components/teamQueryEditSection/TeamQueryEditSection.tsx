"use client";
import { Dispatch, SetStateAction, useContext, useEffect } from "react";
import classNames from "classnames";
import { Checkbox } from "@trussworks/react-uswds";
import Drawer from "@/app/ui/designSystem/drawer/Drawer";
import { UserManagementContext } from "../UserManagementProvider";
import style from "./TeamQueryEditSection.module.scss";
import { User, UserGroup, UserRole } from "@/app/models/entities/users";
import { QueryTableResult } from "@/app/(pages)/queryBuilding/utils";
import { getContextRole } from "../../utils";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import {
  addSingleUserToGroup,
  removeSingleUserFromGroup,
} from "@/app/backend/usergroup-management";

export type UserManagementDrawerProps = {
  userGroups: UserGroup[];
  setUserGroups: Dispatch<SetStateAction<UserGroup[]>>;
  users: User[];
  setUsers: Dispatch<SetStateAction<User[]>>;
};

/**
 * @param root0 - The properties object
 * @param root0.userGroups The list of usergroups to display
 * @param root0.setUserGroups - State function that updates UserGroup data
 * @param root0.users The list of users to display
 * @param root0.setUsers - State function that updates User data
 * @returns TeamQueryEditSection component which is the collapsible section that allows to edit members and queries of a team
 */
const UserManagementDrawer: React.FC<UserManagementDrawerProps> = ({
  userGroups,
  setUserGroups,
  users,
  setUsers,
}) => {
  const {
    teamQueryEditSection,
    closeEditSection,
    handleSearch,
    handleQueryUpdate,
  } = useContext(UserManagementContext);

  const role = getContextRole();

  useEffect(() => {
    console.log(teamQueryEditSection);
  }, [teamQueryEditSection]);

  useEffect(() => {
    const groupId = teamQueryEditSection.groupId;
    const activeGroupIndex = userGroups.findIndex(
      (group) => group.id == groupId,
    );
    const activeGroup = userGroups[activeGroupIndex];
    const dataToUpdate = teamQueryEditSection.subjectData;

    if (activeGroup && teamQueryEditSection.subjectType == "Members") {
      activeGroup.members = dataToUpdate as User[];
      setUserGroups([...userGroups]);
    }
    if (activeGroup && teamQueryEditSection.subjectType === "Queries") {
      activeGroup.queries = dataToUpdate as QueryTableResult[];
      setUserGroups([...userGroups]);
    }
  }, [teamQueryEditSection]);

  const renderQueries = (queries: QueryTableResult[] | undefined) => {
    if (queries && queries.length > 0) {
      return (
        <ul
          aria-description={`queries for ${teamQueryEditSection.title}`}
          className={classNames("usa-list--unstyled", "margin-top-2")}
        >
          {queries.map((query) => {
            return (
              <li key={query.query_id}>
                <Checkbox
                  id={query.query_id}
                  name={query.query_name}
                  label={`${query.query_name}`}
                  defaultChecked
                  onChange={handleQueryUpdate}
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

    const activeGroupIndex = userGroups.findIndex(
      (group) => group.id == teamQueryEditSection.groupId,
    );
    const activeGroup = userGroups[activeGroupIndex];

    return isMemberView
      ? renderUsers(users)
      : renderQueries(activeGroup?.queries);
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
        ? await addSingleUserToGroup(groupId, userId)
        : await removeSingleUserFromGroup(groupId, userId);

      if (updatedUserResponse.totalItems === 0) {
        throw "Unable to update group membership";
      }

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
      showToastConfirmation({
        body: alertText,
      });
    } catch (error) {
      showToastConfirmation({
        heading: "Something went wrong",
        body: alertText,
        variant: "error",
      });
      console.error("Error updating group membership:", error);
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
