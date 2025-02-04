"use client";

import classNames from "classnames";
import SiteAlert from "@/app/ui/designSystem/SiteAlert";
import TabGroup, { Tab } from "@/app/ui/designSystem/TabGroup/tabGroup";

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

  return (
    <>
      <SiteAlert />
      <div className={classNames("main-container__wide", "user-management")}>
        <h1 className="margin-bottom-4">User management</h1>
        <TabGroup tabs={sections} />
        {children}
      </div>
    </>
  );
};

export default UserManagement;
