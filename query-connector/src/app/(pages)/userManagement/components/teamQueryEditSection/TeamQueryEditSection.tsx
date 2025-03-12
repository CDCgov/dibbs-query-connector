"use client";
import { Dispatch, SetStateAction, useContext, useEffect } from "react";
import classNames from "classnames";
import { Checkbox } from "@trussworks/react-uswds";
import Drawer from "@/app/ui/designSystem/drawer/Drawer";
import { UserManagementContext } from "../UserManagementProvider";
import style from "./TeamQueryEditSection.module.scss";
import { User, UserGroup, UserRole } from "@/app/models/entities/users";
import { QueryTableResult } from "@/app/(pages)/queryBuilding/utils";
import { getSessionRole } from "../../utils";

export type UserManagementDrawerProps = {
  userGroups: UserGroup[];
  setUserGroups: Dispatch<SetStateAction<UserGroup[]>>;
  refreshUsers: React.Dispatch<React.SetStateAction<boolean>>;
};

/**
 * @param root0 - The properties object
 * @param root0.userGroups The list of usergroups to display
 * @param root0.setUserGroups - State function that updates UserGroup data
 * @param root0.refreshUsers - State function that indicates if the list of Users should be refreshed
 * @returns TeamQueryEditSection component which is the collapsible section that allows to edit members and queries of a team
 */
const UserManagementDrawer: React.FC<UserManagementDrawerProps> = ({
  userGroups,
  setUserGroups,
  refreshUsers,
}) => {
  const {
    teamQueryEditSection,
    closeEditSection,
    handleSearch,
    handleMemberUpdate,
    handleQueryUpdate,
  } = useContext(UserManagementContext);

  const role = getSessionRole();

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

  const renderUsers = (users: User[] | undefined) => {
    if (users && users.length > 0) {
      return (
        <ul
          aria-description={`members of ${teamQueryEditSection.title}`}
          className={classNames("usa-list--unstyled", "margin-top-2")}
        >
          {users.map((user) => {
            return (
              <li key={user.id}>
                {role == UserRole.SUPER_ADMIN ? (
                  <Checkbox
                    id={user.id}
                    name={user.username}
                    label={`${user.first_name} ${user.last_name}`}
                    defaultChecked
                    onChange={handleMemberUpdate}
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
      ? renderUsers(activeGroup?.members)
      : renderQueries(activeGroup?.queries);
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
