import { render, screen } from "@testing-library/react";
import { RootProviderMock } from "@/app/tests/unit/setup";
import { useSession } from "next-auth/react";
import { UserRole, User } from "@/app/models/entities/users";
import { CustomUserQuery } from "@/app/models/entities/query";
import {
  filterUsers,
  filterQueries,
  getRole,
  FilterableUser,
  FilterableCustomUserQuery,
} from "./utils";

jest.mock("next-auth/react");

const mockUseSession = useSession as jest.Mock;

// Fixtures are declared inline (rather than reused from ./test-utils) because
// test-utils.tsx imports table components whose module graph reaches the DB
// config and would require DATABASE_URL to be set at import time.
const mockSuperAdmin: User = {
  id: "123",
  username: "harrypotter",
  firstName: "Harry",
  lastName: "Potter",
  qcRole: UserRole.SUPER_ADMIN,
};

const mockAdmin: User = {
  id: "456",
  username: "lilypotter",
  firstName: "Lily",
  lastName: "Potter",
  qcRole: UserRole.ADMIN,
};

const mockStandard: User = {
  id: "789",
  username: "hermionegranger",
  firstName: "Hermione",
  lastName: "Granger",
  qcRole: UserRole.STANDARD,
};

const mockQueryNoGroups: CustomUserQuery = {
  queryId: "q1",
  queryName: "Test Query 1",
  conditionsList: [],
  valuesets: [],
};

const mockQueryWithGroups: CustomUserQuery = {
  queryId: "q2",
  queryName: "Test Query 2",
  conditionsList: [],
  valuesets: [],
};

const users = [mockSuperAdmin, mockAdmin, mockStandard];

describe("filterUsers", () => {
  it("flags render=true for the user matched by first name", () => {
    // "Hermione" matches only mockStandard
    const result = filterUsers("Hermione", users) as FilterableUser[];

    expect(result).toHaveLength(3);
    expect((result[0] as FilterableUser).render).toBeUndefined();
    expect((result[1] as FilterableUser).render).toBeUndefined();
    expect(result[2].render).toBe(true);
    expect(result[2].firstName).toBe("Hermione");
  });

  it("flags render=true for the user matched by last name", () => {
    // "Granger" matches only mockStandard
    const result = filterUsers("Granger", users) as FilterableUser[];

    expect(result.filter((u) => u.render).length).toBe(1);
    expect(result[2].render).toBe(true);
  });

  it("flags render=true for the user matched by username", () => {
    // "harrypotter" matches only mockSuperAdmin
    const result = filterUsers("harrypotter", users) as FilterableUser[];

    expect(result[0].render).toBe(true);
    expect((result[1] as FilterableUser).render).toBeUndefined();
    expect((result[2] as FilterableUser).render).toBeUndefined();
  });

  it("matches multiple users when the term is shared (case-insensitive)", () => {
    // "potter" appears in both mockSuperAdmin and mockAdmin last names
    const result = filterUsers("POTTER", users) as FilterableUser[];

    expect(result[0].render).toBe(true);
    expect(result[1].render).toBe(true);
    expect((result[2] as FilterableUser).render).toBeUndefined();
  });

  it("leaves render unset when nothing matches", () => {
    const result = filterUsers("no-such-user", users) as FilterableUser[];

    result.forEach((u) => {
      expect((u as FilterableUser).render).toBeUndefined();
    });
  });

  it("does not mutate the input users", () => {
    const snapshot = structuredClone(users);
    filterUsers("potter", users);
    expect(users).toEqual(snapshot);
  });
});

describe("filterQueries", () => {
  const queries = [mockQueryNoGroups, mockQueryWithGroups] as CustomUserQuery[];

  it("flags render=true for the matched query by name", () => {
    // "Test Query 1" matches only mockQueryNoGroups
    const result = filterQueries(
      "Query 1",
      queries,
    ) as FilterableCustomUserQuery[];

    expect(result).toHaveLength(2);
    expect(result[0].render).toBe(true);
    expect((result[1] as FilterableCustomUserQuery).render).toBeUndefined();
  });

  it("matches all queries sharing a common term (case-insensitive)", () => {
    const result = filterQueries(
      "test query",
      queries,
    ) as FilterableCustomUserQuery[];

    expect(result[0].render).toBe(true);
    expect(result[1].render).toBe(true);
  });

  it("leaves render unset when nothing matches", () => {
    const result = filterQueries(
      "nonexistent",
      queries,
    ) as FilterableCustomUserQuery[];

    result.forEach((q) => {
      expect((q as FilterableCustomUserQuery).render).toBeUndefined();
    });
  });

  it("does not mutate the input queries", () => {
    const snapshot = structuredClone(queries);
    filterQueries("test", queries);
    expect(queries).toEqual(snapshot);
  });
});

// Tiny probe component so the getRole() hook runs inside a React render.
const RoleProbe: React.FC = () => {
  const role = getRole();
  return <div data-testid="role">{String(role)}</div>;
};

describe("getRole", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ data: undefined, status: "loading" });
  });

  it("returns SUPER_ADMIN when auth is disabled (RootProviderMock default)", () => {
    render(
      <RootProviderMock currentPage="/userManagement">
        <RoleProbe />
      </RootProviderMock>,
    );

    expect(screen.getByTestId("role")).toHaveTextContent(UserRole.SUPER_ADMIN);
  });

  it("returns the session role when auth is enabled", () => {
    mockUseSession.mockReturnValue({
      data: { user: { role: UserRole.ADMIN } },
      status: "authenticated",
    });

    render(
      <RootProviderMock
        currentPage="/userManagement"
        runtimeConfig={{ AUTH_DISABLED: "false" }}
      >
        <RoleProbe />
      </RootProviderMock>,
    );

    expect(screen.getByTestId("role")).toHaveTextContent(UserRole.ADMIN);
  });
});
