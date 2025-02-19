"use client";

import React from "react";
import { RoleTypeValues } from "@/app/models/entities/user-management";
import { useSession } from "next-auth/react";
import { isAuthDisabled } from "@/app/utils/auth";
import { redirect, usePathname } from "next/navigation";
import { pagesRoleAccess } from "@/app/shared/page-routes";

/**
 * @param root0 AuthPageGuard component props
 * @param root0.children Content protected behind the auth guard
 * @returns A wrapper component that checks if the user is logged in and their role before displaying content
 * Is a component uses withAuth but the page access has not being set then if will redirect to /unauthorized,
 * unless auth is disabled in which case the component will render without issues.
 */
const WithAuth: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { data: session, status } = useSession();

  const path = usePathname();
  const access = pagesRoleAccess[path] ?? [];

  if (status === "loading") {
    return null;
  } else if (status === "unauthenticated") {
    redirect("/");
  } else if (
    isAuthDisabled() ||
    (session && access.includes(session?.user?.role as RoleTypeValues))
  ) {
    return <>{children}</>;
  } else {
    redirect("/unauthorized");
  }
};

export default WithAuth;
