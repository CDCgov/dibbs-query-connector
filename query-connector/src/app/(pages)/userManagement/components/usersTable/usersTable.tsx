"use client";

import { useEffect, useState, useRef } from "react";
import UserManagementDrawer from "../teamQueryEditSection/TeamQueryEditSection";
import UserGroupsTable from "../userGroups/UserGroupsTable";
import TabGroup, { Tab } from "@/app/ui/designSystem/TabGroup/tabGroup";
import { Button } from "@trussworks/react-uswds";
import UserPermissionsTable from "../userPermissions/userPermissionsTable";
import { QCResponse } from "@/app/models/responses/collections";
import { User, UserGroup, UserRole } from "../../../../models/entities/users";
import {
  getUsers,
  getUserGroups,
  getGroupMembers,
  getGroupQueries,
} from "@/app/backend/user-management";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { UserManagementMode } from "../../utils";
import classNames from "classnames";
import type { ModalRef } from "../../../../ui/designSystem/modal/Modal";
import UserModal from "../../components/userModal/userModal";

export type UsersTableProps = {
  role: string;
  handleOpenModal?: (mode: UserManagementMode) => void;
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
  const [modalMode, setModalMode] = useState<UserManagementMode>("closed");
  const [shouldRefreshUsers, setShouldRefreshUsers] = useState<boolean>(false);

  const modalRef = useRef<ModalRef>(null);

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
      renderContent: () => {
        return (
          <>
            <Button
              onClick={() => handleOpenModal("create-user")}
              className={classNames(
                "styles.createQueryButton",
                "margin-bottom-3",
              )}
              style={{
                marginLeft: "1px",
                backgroundColor: "#005EA2",
              }}
              type="button"
            >
              Add user
            </Button>
            {users.length > 0 ? (
              <UserPermissionsTable
                fetchGroupMembers={fetchGroupMembers}
                users={users}
              />
            ) : (
              <div className="empty-response">No users found</div>
            )}
          </>
        );
      },
    },
    {
      label: "User groups",
      access: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      onClick: setTab,
      renderContent: () =>
        userGroups.length > 0 ? (
          <>
            <Button
              onClick={() => handleOpenModal("create-group")}
              className={classNames(
                "styles.createQueryButton",
                "margin-bottom-3",
              )}
              style={{
                marginLeft: "1px",
                backgroundColor: "#005EA2",
              }}
              type="button"
            >
              Create group
            </Button>
            <UserGroupsTable
              fetchGroupMembers={fetchGroupMembers}
              fetchGroupQueries={fetchGroupQueries}
              userGroups={userGroups}
            />
          </>
        ) : (
          <div className="empty-response">
            <div className="empty-response display-flex flex-column flex-align-start">
              No user groups found
              <Button
                onClick={() => handleOpenModal("create-group")}
                className={classNames(
                  "styles.createQueryButton",
                  "margin-bottom-3",
                )}
                style={{
                  marginLeft: "1px",
                  backgroundColor: "#005EA2",
                }}
                type="button"
              >
                Create group
              </Button>
            </div>
          </div>
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

    if (shouldRefreshUsers) {
      fetchUsers();
      setShouldRefreshUsers(false);
    }
  }, [shouldRefreshUsers]);

  const handleOpenModal = (mode: UserManagementMode) => {
    setModalMode(mode);
    modalRef.current?.toggleModal();
  };

  return (
    <>
      <div className="main-container__wide">
        {shouldRenderTabs && <TabGroup tabs={tabsForRole} />}
        {dataLoaded && activeTab?.renderContent && activeTab?.renderContent()}
        <UserModal
          setMode={setModalMode}
          mode={modalMode}
          modalRef={modalRef}
          refreshUsers={setShouldRefreshUsers}
          userGroups={userGroups}
        />
        <UserManagementDrawer
          userGroups={userGroups}
          setUserGroups={setUserGroups}
          refreshUsers={setShouldRefreshUsers}
        />
      </div>
    </>
  );
};

export default UsersTable;
