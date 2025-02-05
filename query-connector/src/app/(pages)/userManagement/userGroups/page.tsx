"use client";

import { useContext, useEffect, useState } from "react";
import classNames from "classnames";
import { Button } from "@trussworks/react-uswds";
import Table from "../../../ui/designSystem/table/Table";
import { UserGroup, userGroupsMock } from "../types";
import { DataContext } from "../components/DataProvider";

/**
 * User groups section in the user management page
 * @returns The user groups table
 */
const UserGroups: React.FC = () => {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);

  const { OpenEditSection } = useContext(DataContext);

  useEffect(() => {
    setUserGroups(userGroupsMock);
  }, []);

  function GetMemberLabel(memberSize: number): string {
    return memberSize == 1 ? `${memberSize} member` : `${memberSize} members`;
  }

  function GetQueryLabel(querySize: number): string {
    return querySize == 1 ? `${querySize} query` : `${querySize} queries`;
  }

  /**
   * HTML
   */
  return (
    <Table>
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
              <Button
                type="button"
                className={classNames("text-no-underline")}
                unstyled
                aria-description={`Edit ${group.name} members`}
                onClick={() => {
                  OpenEditSection(group.name, "Members", "Members", group.id);
                }}
              >
                {GetMemberLabel(group.memberSize)}
              </Button>
            </td>
            <td>
              <Button
                type="button"
                className={classNames("text-no-underline")}
                unstyled
                aria-description={`Edit ${group.name} queries`}
                onClick={() => {
                  OpenEditSection(group.name, "Queries", "Query", group.id);
                }}
              >
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
