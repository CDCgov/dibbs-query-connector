import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }

  interface Session {
    user?: User;
    expiresIn?: number;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    expiresIn?: number;
  }
}

export default NextAuth;
