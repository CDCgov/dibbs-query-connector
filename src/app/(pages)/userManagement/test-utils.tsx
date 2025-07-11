import React, { createRef, RefObject } from "react";
import { Tab } from "@/app/ui/designSystem/TabGroup/tabGroup";
import { UserRole, User, UserGroup } from "@/app/models/entities/users";
import UserPermissionsTable from "./components/userPermissionsTable/userPermissionsTable";
import UserGroupsTable from "./components/userGroupsTable/UserGroupsTable";
import { CustomUserQuery } from "@/app/models/entities/query";

// User Mocks
export const mockSuperAdmin = {
  id: "123",
  username: "harrypotter",
  firstName: "Harry",
  lastName: "Potter",
  qcRole: UserRole.SUPER_ADMIN,
};

export const mockAdmin: User = {
  id: "456",
  username: "lilypotter",
  firstName: "Lily",
  lastName: "Potter",
  qcRole: UserRole.ADMIN,
  userGroupMemberships: [
    {
      membershipId: "456_876",
      usergroupName: "Order of the Phoenix",
      usergroupId: "876",
      isMember: true,
    },
  ],
};

export const mockStandard: User = {
  id: "789",
  username: "hermionegranger",
  firstName: "Hermione",
  lastName: "Granger",
  qcRole: UserRole.ADMIN,
  userGroupMemberships: [
    {
      membershipId: "789_012",
      usergroupName: "S.P.E.W.",
      usergroupId: "012",
      isMember: true,
    },
  ],
};

// UserGroup Mocks
export const mockGroupBasic: UserGroup = {
  id: "123",
  name: "Hogwarts",
  memberSize: 1,
  querySize: 0,
};

export const mockGroupMany: UserGroup = {
  id: "456",
  name: "Order of the Phoenix",
  memberSize: 3,
  querySize: 3,
  members: [{} as User, {} as User, {} as User],
  queries: [
    {} as CustomUserQuery,
    {} as CustomUserQuery,
    {} as CustomUserQuery,
  ],
};

const mockGroupSingle = {
  id: "789",
  name: "S.P.E.W.",
  memberSize: 1,
  querySize: 1,
  members: [mockAdmin],
  queries: [{} as CustomUserQuery],
};

export const allGroups = [mockGroupMany, mockGroupSingle];

const mockRefs = createRef<RefObject<HTMLTableRowElement | null>[]>();
mockRefs.current = [];

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
        openModal={jest.fn()}
        rowFocusRefs={mockRefs}
        modalData={""}
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
        openModal={jest.fn()}
        modalData={""}
      />,
    ),
};

// Query Mocks
export const mockQueryNoGroups: CustomUserQuery = {
  queryId: "q1",
  queryName: "Test Query 1",
  conditionsList: [],
  valuesets: [],
};

export const mockQueryWithGroups: CustomUserQuery = {
  queryId: "q2",
  queryName: "Test Query 2",
  conditionsList: [],
  valuesets: [],
  groupAssignments: [
    {
      membershipId: `q2_${mockGroupSingle.id}`,
      usergroupName: mockGroupSingle.name,
      usergroupId: mockGroupSingle.id,
      isMember: true,
    },
  ],
};

mockGroupSingle.queries.push(mockQueryWithGroups);

export const mockGroupWithSingleQuery = mockGroupSingle;
