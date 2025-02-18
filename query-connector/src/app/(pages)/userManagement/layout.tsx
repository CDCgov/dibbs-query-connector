"use client";

import classNames from "classnames";
import TabGroup, { Tab } from "@/app/ui/designSystem/TabGroup/tabGroup";
import TeamQueryEditSection from "./components/TeamQueryEditSection";
import UserManagementProvider from "./components/UserManagementProvider";
import WithAuth from "@/app/ui/components/withAuth/WithAuth";

/**
 * @param root0 - User management page layour props
 * @param root0.children - content of the active user management section
 * @returns returns the outher shell of the user management page
 */
const UserManagement: React.FC<React.PropsWithChildren> = ({ children }) => {
  const path = "/userManagement";

  const sections: Tab[] = [
    { label: "Users", path },
    { label: "User groups", path: `${path}/userGroups` },
  ];

  /**
   * HTML
   */
  return (
    <>
      <WithAuth>
        <div className={classNames("main-container__wide", "user-management")}>
          <h1 className="margin-bottom-4">User management</h1>
          <TabGroup tabs={sections} />
          <UserManagementProvider>
            {children}
            <TeamQueryEditSection />
          </UserManagementProvider>
        </div>
      </WithAuth>
    </>
  );
};

export default UserManagement;
