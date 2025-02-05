"use client";

import { Button } from "@trussworks/react-uswds";
import Table from "../../ui/designSystem/table/Table";
import { User, UserGroup, usersMock } from "./types";
import classNames from "classnames";
import { useEffect, useState } from "react";
import RoleDropdown from "./components/RoleDropdown";

/**
 * User section in the user management page
 * @returns Users table
 */
const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  // revisit if this can be retrieve ahead of time
  useEffect(() => {
    setUsers(usersMock);
  }, []);

  return (
    <>
      <div
        className={classNames(
          "margin-x-3",
          "margin-y-4",
          "grid-row",
          "flex-row",
          "flex-no-wrap",
          "flex-justify",
        )}
        aria-description="Available user roles"
      >
        <p className={classNames("grid-col-4")}>
          <span className={classNames("text-bold")}>Super Admin:</span> Manage
          user permissions; create and manage user groups; view audit logs;
          configure FHIR servers; create, assign, and run queries
        </p>
        <p className={classNames("grid-col-4")}>
          <span className={classNames("text-bold")}>Admin:</span> Create,
          assign, and run queries
        </p>
        <p className={classNames("grid-col-3")}>
          <span className={classNames("text-bold")}>Standard:</span> Only run
          queries
        </p>
      </div>
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Permissions</th>
            <th>User groups</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: User) => (
            <tr key={user.id}>
              <td>{`${user.lastName}, ${user.firstName}`}</td>
              <td width={270}>
                <RoleDropdown defaultValue={user.role} />
              </td>
              <td>
                {user.userGroups.length > 0
                  ? user.userGroups.map((group: UserGroup, idx: number) => (
                      <Button
                        className={classNames(
                          "margin-right-2",
                          "text-no-underline",
                        )}
                        type="button"
                        unstyled
                        key={group.id}
                      >
                        {group.name}
                        {idx + 1 != user.userGroups.length && ","}
                      </Button>
                    ))
                  : "--"}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

export default UserManagement;
