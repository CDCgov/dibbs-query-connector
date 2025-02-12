"use client";

import React from "react";
import { RoleTypeValues } from "@/app/models/entities/user-management";
import { useSession } from "next-auth/react";
import { isAuthDisabled } from "@/app/utils/configChecks";
import { redirect, usePathname } from "next/navigation";
import { pagesRoleAccess } from "../header/header";

/**
 * @param root0 AuthPageGuard component props
 * @param root0.children Content protected behind the auth guard
 * @returns A wrapper component that checks if the user is logged in and their role before displaying content
 */
const AuthPageGuard: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { data: session } = useSession();
  const path = usePathname();
  const access = pagesRoleAccess[path];

  if (
    isAuthDisabled() ||
    (session && access.includes(session?.user?.role as RoleTypeValues))
  ) {
    return <>{children}</>;
  } else if (
    session &&
    !access.includes(session?.user?.role as RoleTypeValues)
  ) {
    redirect("/unauthorized");
  } else {
    return null;
  }
};
/* eslint-disable  @typescript-eslint/no-explicit-any */
/**
 * Higher order component that wraps its children behind an auth guard
 * @param WrappedComponent Component that needs the auth checks before rendering
 * @returns A wrapped component that displays its content  if the user is logged in and their role has access
 */
export default function withAuth(WrappedComponent: any) {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  return function authWrapper(props: any) {
    return (
      <AuthPageGuard>
        <WrappedComponent {...props} />
      </AuthPageGuard>
    );
  };
}
