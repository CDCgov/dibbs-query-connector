import React from "react";
import { Tab } from "@/app/ui/designSystem/TabGroup/tabGroup";
import { UserRole, User } from "@/app/models/entities/users";
import UserPermissionsTable from "./components/userPermissions/userPermissionsTable";
import UserGroupsTable from "./components/userGroups/UserGroupsTable";
import { QueryTableResult } from "../queryBuilding/utils";

// User Mocks
export const mockSuperAdmin = {
  id: "123",
  username: "harrypotter",
  first_name: "Harry",
  last_name: "Potter",
  qc_role: UserRole.SUPER_ADMIN,
};

export const mockAdmin = {
  id: "456",
  username: "lilypotter",
  first_name: "Lily",
  last_name: "Potter",
  qc_role: UserRole.ADMIN,
  userGroupMemberships: [
    {
      membership_id: "456_876",
      usergroup_name: "Order of the Phoenix",
      usergroup_id: "876",
      is_member: true,
    },
  ],
};

export const mockStandard = {
  id: "789",
  username: "hermionegranger",
  first_name: "Hermione",
  last_name: "Granger",
  qc_role: UserRole.ADMIN,
  userroupMemberships: [
    {
      membership_id: "789_012",
      usergroup_name: "S.P.E.W.",
      usergroup_id: "012",
      is_member: true,
    },
  ],
};

// UserGroup Mocks
export const mockGroupBasic = {
  id: "123",
  name: "Hogwarts",
  member_size: 1,
  query_size: 0,
};

export const mockGroupMany = {
  id: "456",
  name: "Order of the Phoenix",
  member_size: 3,
  query_size: 3,
  members: [{} as User, {} as User, {} as User],
  queries: [
    {} as QueryTableResult,
    {} as QueryTableResult,
    {} as QueryTableResult,
  ],
};

export const mockGroupSingle = {
  id: "789",
  name: "S.P.E.W.",
  member_size: 1,
  query_size: 1,
  members: [mockAdmin],
  queries: [{} as QueryTableResult],
};

export const allGroups = [mockGroupMany, mockGroupSingle];

// TabGroup Mocks
export const mockPermissionsTab: Tab = {
  label: "Users",
  access: ["Super Admin"],
  onClick: jest.fn(),
  renderContent: jest
    .fn()
    .mockReturnValue(
      <UserPermissionsTable
        setUsers={jest.fn()}
        users={[mockAdmin, mockSuperAdmin]}
        fetchGroupMembers={jest.fn()}
      />,
    ),
};
export const mockGroupsTab: Tab = {
  label: "User Groups",
  access: ["Super Admin", "Admin"],
  onClick: jest.fn(),
  renderContent: jest
    .fn()
    .mockReturnValue(
      <UserGroupsTable
        userGroups={[mockGroupBasic]}
        fetchGroupMembers={jest.fn().mockReturnValue(mockAdmin)}
        fetchGroupQueries={jest.fn()}
      />,
    ),
};
