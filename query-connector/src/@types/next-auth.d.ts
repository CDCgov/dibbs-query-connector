import NextAuth from "next-auth";
declare module "next-auth" {
  interface User {
    id: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    role?: string | null;
  }

  interface Session {
    user: User;
  }
}
export default NextAuth;
