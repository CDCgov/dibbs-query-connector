import { QueryTableResult } from "@/app/(pages)/queryBuilding/utils";

export enum UserRole {
  ADMIN = "Admin",
  STANDARD = "Standard",
  SUPER_ADMIN = "Super Admin",
}
export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  qc_role: UserRole;
  user_groups?: UserGroup[];
}

export interface UserGroup {
  id: string;
  name: string;
  member_size: number;
  query_size: number;
  members?: User[];
  queries?: QueryTableResult[];
}
