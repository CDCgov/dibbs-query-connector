"use client";
import classNames from "classnames";
import { UserRole } from "@/app/models/entities/users";
import WithAuth from "@/app/ui/components/withAuth/WithAuth";
import UserManagementProvider from "./components/UserManagementProvider";
import UserManagementContainer from "./components/userManagementContainer/userManagementContainer";
import { getRole, RoleDescriptons } from "./utils";

/**
 * @param textContent the text values to display
 * @returns HTML element containing text descriptions for each of the User roles
 */
const renderRoleDescriptions = (textContent: object) => {
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
      {Object.entries(textContent).map(([role, description]) => (
        <p key={`${role}`} className={classNames("grid-col-4")}>
          <span className="text-bold">{`${role}:`}</span> {description}
        </p>
      ))}
    </div>
  );
};

/**
 * Client side parent component for the User Management page
 * @returns the UserManagement component
 */
const UserManagement: React.FC = () => {
  const role = getRole();

  return (
    <WithAuth>
      <div className={classNames("main-container__wide", "user-management")}>
        <div
          className={classNames(
            "grid-row",
            "padding-0",
            "flex-justify",
            "flex-align-center",
          )}
        >
          <h1 className="page-title">User management</h1>
        </div>
        <UserManagementProvider>
          {role == UserRole.SUPER_ADMIN &&
            renderRoleDescriptions(RoleDescriptons)}
          <UserManagementContainer role={role as string} />
        </UserManagementProvider>
      </div>
    </WithAuth>
  );
};

export default UserManagement;
