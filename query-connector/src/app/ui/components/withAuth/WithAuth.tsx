"use client";

import React, { useContext } from "react";
import { UserRole } from "@/app/models/entities/users";
import { useSession } from "next-auth/react";
import { redirect, usePathname } from "next/navigation";
import { pagesConfig } from "@/app/shared/page-routes";
import { DataContext } from "@/app/shared/DataProvider";
import { isAuthDisabledClientCheck } from "@/app/utils/auth";

/**
 * @param root0 AuthPageGuard component props
 * @param root0.children Content protected behind the auth guard
 * @returns A wrapper component that checks if the user is logged in and their role before displaying content
 * Is a component uses withAuth but the page access has not being set then if will redirect to /unauthorized,
 * unless auth is disabled in which case the component will render without issues.
 */
const WithAuth: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { status, data: session } = useSession();
  const role = session?.user?.role || "";
  const ctx = useContext(DataContext);
  const isAuthDisabled = isAuthDisabledClientCheck(ctx?.runtimeConfig);
  const path = usePathname();
  const access = pagesConfig[path]?.roleAccess ?? [];

  if (
    isAuthDisabled ||
    (status === "authenticated" && access.includes(role as UserRole))
  ) {
    return <>{children}</>;
  } else if (status === "loading") {
    return null;
  } else if (status === "unauthenticated") {
    redirect("/");
  } else {
    return (
      <div className="main-container__wide">
        <h1>Unauthorized Access</h1>
        <p>You are not authorized to access this page.</p>
      </div>
    );
  }
};

export default WithAuth;
