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
  userGroupMemberships?: UserGroupMembership[];
}

export interface UserGroup {
  id: string;
  name: string;
  member_size: number;
  query_size: number;
  members?: User[];
  queries?: QueryTableResult[];
}

export interface UserGroupMembership {
  membership_id: string;
  usergroup_name: string;
  usergroup_id: string;
  is_member: boolean;
}

export interface Query {
  id: string;
  name: string;
  userGroupMemberships?: UserGroupMembership[];
}
