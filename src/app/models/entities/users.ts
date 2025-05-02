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
  memberSize: number;
  querySize: number;
  members?: User[];
  queries?: CustomUserQuery[];
}

export interface UserGroupMembership {
  membershipId: string;
  usergroupName: string;
  usergroupId: string;
  isMember: boolean;
}

export interface Query {
  id: string;
  name: string;
  userGroupMemberships?: UserGroupMembership[];
}
