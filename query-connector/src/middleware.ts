import authConfig from "./auth.config";
import NextAuth from "next-auth";
import { RoleTypeValues } from "./app/models/entities/user-management";
import { NextResponse } from "next/server";

const superAdminRoutes = ["/userManagement", "/userManagement/userGroups"];

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isSuperAdminRoute = superAdminRoutes.includes(path);
  const session = req.auth;

  if (
    isSuperAdminRoute &&
    !session &&
    session?.user?.role !== RoleTypeValues.SuperAdmin
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
