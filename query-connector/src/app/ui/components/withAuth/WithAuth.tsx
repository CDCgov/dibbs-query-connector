"use client";

import React from "react";
import { RoleTypeValues } from "@/app/models/entities/user-management";
import { useSession } from "next-auth/react";
import { isAuthDisabled } from "@/app/utils/configChecks";

interface AuthGuardProps extends React.PropsWithChildren {
  access: RoleTypeValues[];
}

/**
 * @param root0 WithAuth component props
 * @param root0.children Content protected behind the auth guard
 * @param root0.access List of roles allowed to see the content
 * @returns A wrapper component that checks if the user is logged in and their role before displaying content
 */
const WithAuth: React.FC<AuthGuardProps> = ({ children, access }) => {
  const { data: session } = useSession();

  if (
    isAuthDisabled() ||
    (session && access.includes(session?.user?.role as RoleTypeValues))
  ) {
    return <>{children}</>;
  } else {
    return null;
  }
};

export default WithAuth;
