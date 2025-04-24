import { CustomUserQuery } from "./query";

export enum UserRole {
  ADMIN = "Admin",
  STANDARD = "Standard",
  SUPER_ADMIN = "Super Admin",
}
export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  qcRole: UserRole;
  userGroupMemberships?: UserGroupMembership[];
}

export interface UserGroup {
  id: string;
  name: string;
  member_size: number;
  query_size: number;
  members?: User[];
  queries?: CustomUserQuery[];
}

export interface UserGroupMembership {
  membership_id: string;
  usergroup_name: string;
  usergroup_id: string;
  is_member: boolean;
  membershipId?: string;
  usergroupName?: string;
  usergroupId?: string;
  isMember?: boolean;
}

export interface Query {
  id: string;
  name: string;
  userGroupMemberships?: UserGroupMembership[];
}
