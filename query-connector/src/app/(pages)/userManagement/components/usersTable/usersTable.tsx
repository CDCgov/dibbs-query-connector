"use client";

import { useEffect, useState } from "react";
import TeamQueryEditSection from "../teamQueryEditSection/TeamQueryEditSection";

import UserGroups from "../userGroups/UserGroupsTable";
import TabGroup, { Tab } from "@/app/ui/designSystem/tabGroup/tabGroup";
import UserPermissionsTable from "../userPermissions/UserPermissionsTable";
import { QCResponse } from "@/app/models/responses/collections";
import { User, UserGroup } from "../../../../models/entities/user-management";
import { getUsers, getAllUserGroups } from "@/app/backend/user-management";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";

export type UsersTableProps = {
  role: string;
};

/**
 * UsersTable container component
 * @param root0 - UsersTable container props
 * @param root0.role - The permissions role of the current logged-in user
 * @returns The UsersTable container component
 */
const UsersTable: React.FC<UsersTableProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<Tab>();
  const [users, setUsers] = useState<User[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);

  async function fetchUsers() {
    try {
      const userList: QCResponse<User> = await getUsers();
      setUsers(userList.items);
    } catch (e) {
      showToastConfirmation({
        body: "Unable to retrieve users. Please try again.",
        variant: "error",
      });
      throw e;
    }
  }
  async function fetchUserGroups() {
    const userGroups = await getAllUserGroups();
    return setUserGroups(userGroups.items);
  }

  useEffect(() => {
    fetchUsers();
    fetchUserGroups();
  }, []);

  const setTab = (e: React.MouseEvent<HTMLElement>) => {
    const clickedTab = e.currentTarget.innerHTML;
    const tabObj = tabsForRole.filter((tab) => tab.label == clickedTab)[0];
    setActiveTab(tabObj);
  };

  const sections: Tab[] = [
    {
      label: "Users",
      access: ["Super Admin"],
      onClick: setTab,
      renderContent: () => <UserPermissionsTable users={users} />,
    },
    {
      label: "User groups",
      access: ["Super Admin", "Admin"],
      onClick: setTab,
      renderContent: () => (
        <UserGroups
          userGroups={userGroups}
          setUserGroups={setUserGroups}
          users={users}
        />
      ),
    },
    // {
    //   label: "Secret third tab",
    //   access: ["Super Admin", "Admin"],
    //   onClick: setTab,
    //   renderContent: () => <div>"Secret third tab...</div>,
    // },
  ];

  const tabsForRole = sections.filter((tab) => tab.access?.includes(role));
  const defaultTab = tabsForRole[0];

  useEffect(() => {
    setActiveTab(defaultTab); // once users are loaded, set the default table display
  }, [users]);

  const shouldRenderTabs = tabsForRole.length > 1;

  return (
    <>
      {shouldRenderTabs && <TabGroup tabs={tabsForRole} />}
      {users && activeTab?.renderContent && activeTab?.renderContent()}
      <TeamQueryEditSection />
    </>
  );
};

export default UsersTable;
