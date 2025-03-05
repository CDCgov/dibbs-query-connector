export enum RoleTypeValues {
  Admin = "Admin",
  SuperAdmin = "Super Admin",
  Standard = "Standard User",
}

export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  qc_role:
    | RoleTypeValues.SuperAdmin
    | RoleTypeValues.Admin
    | RoleTypeValues.Standard;
  userGroups?: UserGroup[];
  userGroupMemberships?: UserGroupMembership[];
}

export interface UserGroup {
  id: string;
  name: string;
  memberSize: number;
  querySize: number;
}

export interface UserGroupMembership {
  id: string;
  group_name: string;
  usergroup_id: string;
  is_member: boolean;
}

export interface Query {
  id: string;
  name: string;
  userGroupMemberships?: UserGroupMembership[];
}
