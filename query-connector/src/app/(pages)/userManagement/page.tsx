"use client";

import { Button, Table } from "@trussworks/react-uswds";
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
    <Table fullWidth={true} className="qc-table">
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
            <td width={300}>
              <RoleDropdown defaultValue="super-admin" />
            </td>
            <td>
              {user.userGroups.length > 0
                ? user.userGroups.map((group: UserGroup) => (
                    <Button
                      className={classNames("margin-right-2")}
                      type="button"
                      unstyled
                      key={group.id}
                    >
                      {group.name}
                    </Button>
                  ))
                : "--"}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default UserManagement;
