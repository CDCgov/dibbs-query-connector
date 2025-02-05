export interface UserGroup {
  id: string;
  name: string;
  memberSize: number;
  querySize: number;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role:
    | RoleTypeValues.SuperAdmin
    | RoleTypeValues.Admin
    | RoleTypeValues.Standard;
  userGroups: UserGroup[];
}

export enum RoleTypeValues {
  Admin = "Admin",
  SuperAdmin = "Super Admin",
  Standard = "Standard",
}

// Temporary file with dumy data
export const team1: UserGroup = {
  id: "123",
  name: "Team 1",
  memberSize: 3,
  querySize: 1,
};

export const team2: UserGroup = {
  id: "124",
  name: "Team 2",
  memberSize: 1,
  querySize: 2,
};

export const usersMock: User[] = [
  {
    id: "1",
    firstName: "Jane",
    lastName: "Doe",
    role: RoleTypeValues.Admin,
    userGroups: [],
  },
  {
    id: "2",
    firstName: "John",
    lastName: "Smith",
    role: RoleTypeValues.Standard,
    userGroups: [team1, team2],
  },
  {
    id: "3",
    firstName: "Lucas",
    lastName: "Green",
    role: RoleTypeValues.SuperAdmin,
    userGroups: [team1],
  },
];

export const userGroupsMock: UserGroup[] = [team1, team2];
