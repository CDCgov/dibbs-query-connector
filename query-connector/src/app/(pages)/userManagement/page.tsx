"use client";
import { useSession } from "next-auth/react";
import classNames from "classnames";
import styles from "./userManagement.module.scss";
import { UserRole } from "@/app/models/entities/user-management";
import WithAuth from "@/app/ui/components/withAuth/WithAuth";
import UserManagementProvider from "./components/UserManagementProvider";
import UsersTable from "./components/usersTable/usersTable";

/**
 * Client side parent component for the User Management page
 * @returns the UserManagement component
 */
const UserManagement: React.FC<React.PropsWithChildren> = () => {
  const { data: session } = useSession();
  const role = session?.user.role;

  const renderRoleDescriptions = () => {
    return (
      <div
        className={styles.roleDescriptions}
        aria-description="Available user roles"
      >
        <p className={styles.textContainer}>
          <span className="text-bold">Super Admin:</span> Manage user
          permissions; create and manage user groups; view audit logs; configure
          FHIR servers; create, assign, and run queries
        </p>
        <p className={styles.textContainer}>
          <span className={"text-bold"}>Admin:</span> Create, assign, and run
          queries
        </p>
        <p className={styles.textContainer}>
          <span className={"text-bold"}>Standard:</span> Only run queries
        </p>
      </div>
    );
  };

  return (
    <>
      <WithAuth>
        <div className={classNames("main-container__wide", "user-management")}>
          <h1 className="page-title">User management</h1>
          <UserManagementProvider>
            {role == UserRole.SUPER_ADMIN && renderRoleDescriptions()}
            <UsersTable role={role as string}></UsersTable>
          </UserManagementProvider>
        </div>
      </WithAuth>
    </>
  );
};

export default UserManagement;
