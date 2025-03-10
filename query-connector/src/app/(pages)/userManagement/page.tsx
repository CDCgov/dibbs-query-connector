"use client";
import classNames from "classnames";
import { UserRole } from "@/app/models/entities/users";
import WithAuth from "@/app/ui/components/withAuth/WithAuth";
import UserManagementProvider from "./components/UserManagementProvider";
import ManagementTabs from "./components/managementTabs/managementTabs";
import { getSessionRole } from "./utils";
import { isAuthDisabledClientCheck } from "@/app/utils/auth";
import { useContext } from "react";
import { DataContext } from "@/app/shared/DataProvider";

/**
 * Client side parent component for the User Management page
 * @returns the UserManagement component
 */
const UserManagement: React.FC = () => {
  const ctx = useContext(DataContext);
  const role = isAuthDisabledClientCheck(ctx?.runtimeConfig)
    ? UserRole.SUPER_ADMIN
    : getSessionRole();

  const renderRoleDescriptions = () => {
    return (
      <div
        className={classNames(
          "margin-x-3",
          "margin-y-4",
          "grid-row",
          "flex-row",
          "flex-no-wrap",
          "flex-justify",
          "grid-gap",
        )}
        aria-description="Available user roles"
      >
        <p className={classNames("grid-col-4")}>
          <span className="text-bold">Super Admin:</span> Manage user
          permissions; create and manage user groups; view audit logs; configure
          FHIR servers; create, assign, and run queries
        </p>
        <p className={classNames("grid-col-4")}>
          <span className={"text-bold"}>Admin:</span> Create, assign, and run
          queries
        </p>
        <p className={classNames("grid-col-3")}>
          <span className={"text-bold"}>Standard:</span> Only run queries
        </p>
      </div>
    );
  };

  return (
    <WithAuth>
      <div className={classNames("main-container__wide", "user-management")}>
        <h1 className="page-title">User management</h1>
        <UserManagementProvider>
          {role == UserRole.SUPER_ADMIN && renderRoleDescriptions()}
          {role && <ManagementTabs role={role as UserRole} />}
        </UserManagementProvider>
      </div>
    </WithAuth>
  );
};

export default UserManagement;
