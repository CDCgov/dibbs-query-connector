// Temporary file with dumy data

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
  role: string;
  userGroups: UserGroup[];
}

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
    role: "Admin",
    userGroups: [],
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Doe",
    role: "Standard",
    userGroups: [team1, team2],
  },
  {
    id: "3",
    firstName: "Jane",
    lastName: "Doe",
    role: "Super Admin",
    userGroups: [team1],
  },
];

export const userGroupsMock: UserGroup[] = [team1, team2];
