"use client";

import { Button, Table } from "@trussworks/react-uswds";
import { UserGroup, userGroupsMock } from "../types";
import { useEffect, useState } from "react";

/**
 * User groups section in the user management page
 * @returns The user groups table
 */
const UserGroups: React.FC = () => {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);

  useEffect(() => {
    setUserGroups(userGroupsMock);
  }, []);

  function GetMemberLabel(memberSize: number) {
    return memberSize == 1 ? `${memberSize} member` : `${memberSize} members`;
  }

  function GetQueryLabel(querySize: number) {
    return querySize == 1 ? `${querySize} query` : `${querySize} queries`;
  }

  /**
   * HTML
   */
  return (
    <Table fullWidth={true} className="qc-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Members</th>
          <th>Assigned queries</th>
        </tr>
      </thead>
      <tbody>
        {userGroups.map((group: UserGroup) => (
          <tr key={group.id}>
            <td>{group.name}</td>
            <td>
              <Button type="button" unstyled onClick={() => {}}>
                {GetMemberLabel(group.memberSize)}
              </Button>
            </td>
            <td>
              <Button type="button" unstyled onClick={() => {}}>
                {GetQueryLabel(group.querySize)}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default UserGroups;
