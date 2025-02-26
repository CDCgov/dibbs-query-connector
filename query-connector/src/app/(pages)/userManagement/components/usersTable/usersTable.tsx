"use client";

import { useEffect, useState } from "react";
import UserManagementDrawer from "../teamQueryEditSection/TeamQueryEditSection";

import UserGroups from "../userGroups/UserGroupsTable";
import TabGroup, { Tab } from "../../../../ui/designSystem/tabGroup/tabGroup";
import UserPermissionsTable from "../userPermissions/userPermissionsTable";
import { QCResponse } from "@/app/models/responses/collections";
import {
  User,
  UserGroup,
  UserRole,
} from "../../../../models/entities/user-management";
import {
  getUsers,
  getUserGroups,
  getGroupMembers,
  getGroupQueries,
} from "@/app/backend/user-management";
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

  async function fetchGroupMembers(groupId: string) {
    const groupMembers = await getGroupMembers(groupId);
    return groupMembers.items;
  }

  async function fetchGroupQueries(groupId: string) {
    const queries = await getGroupQueries(groupId);
    return queries.items;
  }

  const setTab = (e: React.MouseEvent<HTMLElement>) => {
    const clickedTab = e.currentTarget.innerHTML;
    const tabObj = tabsForRole.filter((tab) => tab.label == clickedTab)[0];
    setActiveTab(tabObj);
  };

  const sections: Tab[] = [
    {
      label: "Users",
      access: [UserRole.SUPER_ADMIN],
      onClick: setTab,
      renderContent: () =>
        users.length > 0 ? (
          <UserPermissionsTable
            fetchGroupMembers={fetchGroupMembers}
            users={users}
          />
        ) : (
          <div className="empty-response">No users found</div>
        ),
    },
    {
      label: "User groups",
      access: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      onClick: setTab,
      renderContent: () =>
        userGroups.length > 0 ? (
          <UserGroups
            fetchGroupMembers={fetchGroupMembers}
            fetchGroupQueries={fetchGroupQueries}
            userGroups={userGroups}
          />
        ) : (
          <div className="empty-response">No user groups found</div>
        ),
    },
  ];
  const tabsForRole = sections.filter((tab) => tab.access?.includes(role));
  const defaultTab = tabsForRole[0];
  const shouldRenderTabs = tabsForRole.length > 1;

  useEffect(() => {
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
      try {
        const userGroups: QCResponse<UserGroup> = await getUserGroups();
        return setUserGroups(userGroups.items);
      } catch (e) {
        showToastConfirmation({
          body: "Unable to retrieve user groups. Please try again.",
          variant: "error",
        });
        throw e;
      }
    }

    role == UserRole.SUPER_ADMIN && users.length <= 0 && fetchUsers();
    userGroups.length <= 0 && fetchUserGroups();
  }, []);

  const dataLoaded =
    role == UserRole.ADMIN ? !!users && !!userGroups : !!userGroups;

  useEffect(() => {
    setActiveTab(defaultTab); // once data are loaded, set the default table display
  }, [users, userGroups.length]);

  return (
    <div className="main-container__wide">
      {shouldRenderTabs && <TabGroup tabs={tabsForRole} />}
      {dataLoaded && activeTab?.renderContent && activeTab?.renderContent()}
      <UserManagementDrawer
        userGroups={userGroups}
        setUserGroups={setUserGroups}
      />
    </div>
  );
};

export default UsersTable;
