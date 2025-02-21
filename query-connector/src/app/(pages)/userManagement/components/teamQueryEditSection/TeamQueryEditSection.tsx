"use client";

import { useContext } from "react";
import classNames from "classnames";
import { Checkbox } from "@trussworks/react-uswds";
import Drawer from "@/app/ui/designSystem/drawer/Drawer";
import { UserManagementContext } from "../UserManagementProvider";
import style from "./TeamQueryEditSection.module.scss";
import {
  User,
  UserGroup,
  UserRole,
} from "@/app/models/entities/user-management";
import { QueryTableResult } from "@/app/(pages)/queryBuilding/utils";
import { useSession } from "next-auth/react";

export type UserManagementDrawerProps = {
  userGroups: UserGroup[];
};

/**
 * @param root0 - The properties object
 * @param root0.userGroups The list of usergroups to display
 * @returns TeamQueryEditSection component which is the collapsible section that allows to edit members and queries of a team
 */
const UserManagementDrawer: React.FC<UserManagementDrawerProps> = ({
  userGroups,
}) => {
  const {
    teamQueryEditSection,
    closeEditSection,
    handleSearch,
    handleMemberUpdate,
    handleQueryUpdate,
  } = useContext(UserManagementContext);

  const { data: session } = useSession();
  const role = session?.user.role;

  const renderQueries = (queries: QueryTableResult[] | undefined) => {
    if (queries) {
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
                  onChange={(e: React.ChangeEvent) => handleQueryUpdate(e)}
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
    if (users) {
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
    return (
      <div>{`Error: could not retrieve ${content} for user group. Please try again later.`}</div>
    );
  };

  function generateContent(): JSX.Element {
    const isMemberView = teamQueryEditSection.subjectType == "Members";

    const group = userGroups.filter(
      (group) => group.id == teamQueryEditSection.groupId,
    )[0];

    return isMemberView
      ? renderUsers(group?.members)
      : renderQueries(group?.queries);
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
