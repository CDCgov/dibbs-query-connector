"use client";

import { useEffect, useState, useRef } from "react";
import UserManagementDrawer from "../teamQueryEditSection/TeamQueryEditSection";
import UserGroupsTable from "../userGroups/UserGroupsTable";
import TabGroup, { Tab } from "@/app/ui/designSystem/TabGroup/tabGroup";
import { Button } from "@trussworks/react-uswds";
import UserPermissionsTable from "../userPermissions/userPermissionsTable";
import { QCResponse } from "@/app/models/responses/collections";
import { User, UserGroup, UserRole } from "../../../../models/entities/users";
import { getAllUsers } from "@/app/backend/user-management";
import {
  getAllGroupMembers,
  getAllGroupQueries,
  getAllUserGroups,
} from "@/app/backend/usergroup-management";
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
  const [shouldRefreshView, setShouldRefreshView] = useState<boolean | string>(
    true,
  );

  const modalRef = useRef<ModalRef>(null);

  const setTab = (e: React.MouseEvent<HTMLElement>) => {
    const clickedTab = e.currentTarget.innerHTML;
    const tabObj = tabsForRole.filter((tab) => tab.label == clickedTab)[0];
    setShouldRefreshView(tabObj.label);
    setActiveTab(tabObj);
  };

  const sections: Tab[] = [
    {
      label: "Users",
      access: [UserRole.SUPER_ADMIN],
      onClick: setTab,
      renderContent: (users?: User[]) => {
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
            {users && users.length > 0 ? (
              <UserPermissionsTable
                fetchGroupMembers={fetchGroupMembers}
                users={users}
                setUsers={setUsers}
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

  async function fetchUsers() {
    try {
      const userList: QCResponse<User> = await getAllUsers();
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
      const userGroups: QCResponse<UserGroup> = await getAllUserGroups();
      return setUserGroups(userGroups.items);
    } catch (e) {
      showToastConfirmation({
        body: "Unable to retrieve user groups. Please try again.",
        variant: "error",
      });
      throw e;
    }
  }

  async function fetchGroupMembers(groupId: string) {
    const groupMembers = await getAllGroupMembers(groupId);
    return groupMembers.items;
  }

  async function fetchGroupQueries(groupId: string) {
    const queries = await getAllGroupQueries(groupId);
    return queries.items;
  }

  // page load
  useEffect(() => {
    role == UserRole.SUPER_ADMIN && users.length <= 0 && fetchUsers();
    userGroups.length <= 0 && fetchUserGroups();
  }, []);

  // wait for users/groups to load before setting active tab;
  // reset shouldRefreshView to false so that the table view
  // doesn't change back to default when we update data in the
  // background (e.g. after clicking checkboxes in the drawer)
  useEffect(() => {
    if (shouldRefreshView) {
      setActiveTab(defaultTab);
      setShouldRefreshView(false);
    }
  }, [users, userGroups]);

  // update the table display when we modify data via the modal
  // or when we click to change tabs
  useEffect(() => {
    if (shouldRefreshView == "Users") {
      fetchUsers();
      setShouldRefreshView(false);
    }
    if (shouldRefreshView == "User groups") {
      fetchUserGroups();
      setShouldRefreshView(false);
    }
  }, [shouldRefreshView]);

  const handleOpenModal = (mode: UserManagementMode) => {
    setModalMode(mode);
    modalRef.current?.toggleModal();
  };

  const dataLoaded =
    role == UserRole.ADMIN ? !!users && !!userGroups : !!userGroups;

  return (
    <>
      <div className="main-container__wide">
        {shouldRenderTabs && <TabGroup tabs={tabsForRole} />}
        {dataLoaded &&
          activeTab?.renderContent &&
          activeTab?.renderContent(users, userGroups)}
        <UserModal
          setModalMode={setModalMode}
          modalMode={modalMode}
          modalRef={modalRef}
          refreshView={setShouldRefreshView}
          userGroups={userGroups}
        />
        <UserManagementDrawer
          users={users}
          setUsers={setUsers}
          userGroups={userGroups}
          setUserGroups={setUserGroups}
        />
      </div>
    </>
  );
};

export default UsersTable;
