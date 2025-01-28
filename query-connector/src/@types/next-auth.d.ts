declare module "next-auth" {
  interface User {
    id: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }

  interface Session {
    user: User;
  }
}
