import {
  addUsersToGroup,
  addQueriesToGroup,
  getAllGroupMembers,
  getAllGroupQueries,
  removeUsersFromGroup,
  removeQueriesFromGroup,
  saveUserGroupMembership,
} from "@/app/backend/usergroup-management";
import { getAllUsersWithSingleGroupStatus } from "@/app/backend/user-management";
import { getDbClient } from "@/app/backend/dbClient";
import { User } from "@/app/models/entities/users";
import { suppressConsoleLogs } from "./fixtures";
import { QueryDataColumn } from "@/app/(pages)/queryBuilding/utils";

const dbClient = getDbClient();

jest.mock("@/app/utils/auth", () => ({
  superAdminAccessCheck: jest.fn(() => Promise.resolve(true)),
  adminAccessCheck: jest.fn(() => Promise.resolve(true)),
}));

const TEST_GROUP_ID = "00000000-0000-0000-0000-000000000001";
const TEST_USER_1_ID = "00000000-0000-0000-0000-000000000002";
const TEST_USER_2_ID = "00000000-0000-0000-0000-000000000003";
const TEST_USER_3_ID = "00000000-0000-0000-0000-000000000004";
const TEST_QUERY_1_ID = "00000000-0000-0000-0000-000000000005";
const TEST_QUERY_2_ID = "00000000-0000-0000-0000-000000000006";
const TEST_QUERY_3_ID = "00000000-0000-0000-0000-000000000007";
const TEST_QUERY_CONDITIONS: string[] = [];
const TEST_QUERY_DATA: QueryDataColumn = {};

describe("User Group and Query Membership Tests", () => {
  beforeAll(async () => {
    suppressConsoleLogs();

    // Insert test users
    const insertUsersQuery = `
      INSERT INTO users (id, username, first_name, last_name, qc_role)
      VALUES
        ($1, 'testuser1', 'Test', 'User1', 'Standard User'),
        ($2, 'testuser2', 'Test', 'User2', 'Standard User'),
        ($3, 'testuser3', 'Test', 'User3', 'Standard User')
      ON CONFLICT DO NOTHING;
    `;
    await dbClient.query(insertUsersQuery, [
      TEST_USER_1_ID,
      TEST_USER_2_ID,
      TEST_USER_3_ID,
    ]);

    // Insert test group
    const insertGroupQuery = `
      INSERT INTO usergroup (id, name)
      VALUES ($1, 'Test Group')
      ON CONFLICT DO NOTHING;
    `;
    await dbClient.query(insertGroupQuery, [TEST_GROUP_ID]);

    // Insert test queries
    const insertQueryQuery = `INSERT INTO query (id, query_name, conditions_list, query_data)
    VALUES
      ($1, 'Test Query 1', $4, $5),
      ($2, 'Test Query 2', $4, $5),
      ($3, 'Test Query 3', $4, $5)
      ON CONFLICT DO NOTHING;

    `;

    await dbClient.query(insertQueryQuery, [
      TEST_QUERY_1_ID,
      TEST_QUERY_2_ID,
      TEST_QUERY_3_ID,
      TEST_QUERY_CONDITIONS,
      TEST_QUERY_DATA,
    ]);
  });

  afterAll(async () => {
    try {
      await dbClient.query(
        "DELETE FROM usergroup_to_users WHERE usergroup_id = $1;",
        [TEST_GROUP_ID],
      );
      await dbClient.query(
        "DELETE FROM usergroup_to_query WHERE usergroup_id = $1;",
        [TEST_GROUP_ID],
      );
      await dbClient.query("DELETE FROM usergroup WHERE id = $1;", [
        TEST_GROUP_ID,
      ]);
      await dbClient.query("DELETE FROM users WHERE id IN ($1, $2, $3);", [
        TEST_USER_1_ID,
        TEST_USER_2_ID,
        TEST_USER_3_ID,
      ]);
      await dbClient.query("DELETE FROM query WHERE id IN ($1, $2, $3);", [
        TEST_QUERY_1_ID,
        TEST_QUERY_2_ID,
        TEST_QUERY_3_ID,
      ]);
    } catch (error) {
      console.error("Rollback failed:", error);
    }
  });

  /**
   * Tests retrieving user group memberships.
   */
  test("should retrieve user group memberships", async () => {
    const result: User[] =
      await getAllUsersWithSingleGroupStatus(TEST_GROUP_ID);

    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("username");
    expect(result[0]).toHaveProperty("userGroupMemberships");

    const membership = result[0].userGroupMemberships?.find(
      (m: { usergroupId: string; usergroupName: string }) =>
        m.usergroupId === TEST_GROUP_ID,
      (m: { usergroupId: string; usergroupName: string }) =>
        m.usergroupName === "Test Group",
    );
    expect(membership).toBeDefined();
    expect(membership?.isMember).toBeDefined();
  });

  /**
   * Tests adding users to a user group.
   */
  test("should add multiple users to a group", async () => {
    const result = await addUsersToGroup(TEST_GROUP_ID, [
      TEST_USER_1_ID,
      TEST_USER_2_ID,
    ]);

    expect(result.totalItems).toBe(2);
    expect(result.items.some((user) => user.id == TEST_USER_1_ID));
    expect(result.items.some((user) => user.id == TEST_USER_2_ID));

    const members = (await getAllGroupMembers(TEST_GROUP_ID)).items;

    expect(members.length).toBe(2);
    expect(members.some((user) => user.id == TEST_USER_1_ID)).toBe(true);
    expect(members.some((user) => user.id == TEST_USER_2_ID)).toBe(true);
  });

  test("should add a single user to a group", async () => {
    const result = await addUsersToGroup(TEST_GROUP_ID, [TEST_USER_3_ID]);
    expect(result.totalItems).toBe(1);
    expect(result.items[0].id).toContain(TEST_USER_3_ID);
    expect(result?.items[0].userGroupMemberships?.[0].membershipId).toContain(
      TEST_GROUP_ID,
    );
  });

  test("should not add duplicate users to a group", async () => {
    await addUsersToGroup(TEST_GROUP_ID, [TEST_USER_1_ID]);
    const result = await addUsersToGroup(TEST_GROUP_ID, [TEST_USER_1_ID]);
    expect(result.totalItems).toEqual(0);
    expect(result.items).toEqual([]);
  });

  /**
   * Tests removing users from a user group.
   */
  test("should remove multiple users from a group", async () => {
    const users: User[] = await getAllUsersWithSingleGroupStatus(TEST_GROUP_ID);
    const members = users.filter((user) =>
      user.userGroupMemberships?.some((m) => m.isMember),
    );
    expect(members.length).toBe(3);

    const result = await removeUsersFromGroup(TEST_GROUP_ID, [
      TEST_USER_1_ID,
      TEST_USER_2_ID,
    ]);

    expect(result.items[0].id).toContain(TEST_USER_1_ID);
    expect(result.items[1].id).toContain(TEST_USER_2_ID);

    const updatedMembers = await getAllGroupMembers(TEST_GROUP_ID);

    expect(updatedMembers.items.length).toBe(1);
    expect(
      updatedMembers.items.some(
        (user) =>
          user.id === TEST_USER_1_ID &&
          user.userGroupMemberships?.some((m) => m.isMember),
      ),
    ).toBe(false);
    expect(
      updatedMembers.items.some(
        (user) =>
          user.id === TEST_USER_2_ID &&
          user.userGroupMemberships?.some((m) => m.isMember),
      ),
    ).toBe(false);
  });

  test("should remove a single user from a group", async () => {
    const result = await removeUsersFromGroup(TEST_GROUP_ID, [TEST_USER_3_ID]);
    expect(result.items.length).toBe(1);

    const users: User[] = await getAllUsersWithSingleGroupStatus(TEST_GROUP_ID);
    const members = users.filter((user) =>
      user.userGroupMemberships?.some((m) => m.isMember),
    );

    expect(members.length).toBe(0);
    expect(
      users.some(
        (user) =>
          user.id === TEST_USER_3_ID &&
          user.userGroupMemberships?.some((m) => m.isMember),
      ),
    ).toBe(false);
  });

  test("should not remove a user that is not in the group", async () => {
    const result = await removeUsersFromGroup(TEST_GROUP_ID, [TEST_USER_3_ID]);
    expect(result.items).toEqual([]);
  });

  /**
   * Tests saving user group memberships.
   */
  test("should correctly update user group memberships", async () => {
    const selectedUsers = [TEST_USER_1_ID];

    // Add and remove users in one call
    const { users: updatedUsers } = await saveUserGroupMembership(
      TEST_GROUP_ID,
      selectedUsers,
    );

    // Verify membership contains only selected users
    expect(
      updatedUsers.some(
        (user) =>
          user.id === TEST_USER_1_ID &&
          user.userGroupMemberships?.some((m) => m.isMember),
      ),
    ).toBe(true);
    expect(
      updatedUsers.some(
        (user) =>
          user.id === TEST_USER_2_ID &&
          user.userGroupMemberships?.some((m) => m.isMember),
      ),
    ).toBe(false);
  });

  /**
   * Tests adding queries to a user group.
   */
  test("should add multiple queries to a group", async () => {
    const result = await addQueriesToGroup(TEST_GROUP_ID, [
      TEST_QUERY_2_ID,
      TEST_QUERY_3_ID,
    ]);

    expect(result.totalItems).toBe(2);
    expect(result.items.some((query) => query.queryId == TEST_QUERY_2_ID));
    expect(result.items.some((query) => query.queryId == TEST_QUERY_3_ID));

    const queriesList = (await getAllGroupQueries(TEST_GROUP_ID)).items;

    expect(queriesList.length).toBe(2);
    expect(queriesList.some((query) => query.queryId == TEST_QUERY_2_ID)).toBe(
      true,
    );
    expect(queriesList.some((query) => query.queryId == TEST_QUERY_3_ID)).toBe(
      true,
    );
  });

  test("should add a single query to a group", async () => {
    const result = await addQueriesToGroup(TEST_GROUP_ID, [TEST_QUERY_1_ID]);
    expect(result.totalItems).toBe(1);
    expect(result.items[0].queryId).toContain(TEST_QUERY_1_ID);
    expect(result?.items[0].groupAssignments?.[0].membershipId).toContain(
      TEST_GROUP_ID,
    );
  });

  test("should not add duplicate queries to a group", async () => {
    await addQueriesToGroup(TEST_GROUP_ID, [TEST_QUERY_1_ID]);
    const result = await addQueriesToGroup(TEST_GROUP_ID, [TEST_QUERY_1_ID]);
    expect(result.totalItems).toEqual(0);
    expect(result.items).toEqual([]);
  });

  /**
   * Tests removing queries from a user group.
   */
  test("should remove multiple queries from a group", async () => {
    const result = await removeQueriesFromGroup(TEST_GROUP_ID, [
      TEST_QUERY_2_ID,
      TEST_QUERY_3_ID,
    ]);

    expect(result.items[0].queryId).toContain(TEST_QUERY_2_ID);
    expect(result.items[1].queryId).toContain(TEST_QUERY_3_ID);

    const updatedQueries = await getAllGroupQueries(TEST_GROUP_ID);

    expect(updatedQueries.items.length).toBe(1);
    expect(
      updatedQueries.items.some(
        (query) =>
          query.queryId === TEST_USER_2_ID &&
          query.groupAssignments?.some((q) => q.isMember),
      ),
    ).toBe(false);

    expect(
      updatedQueries.items.some(
        (query) =>
          query.queryId === TEST_USER_3_ID &&
          query.groupAssignments?.some((q) => q.isMember),
      ),
    ).toBe(false);
  });

  test("should remove a single query from a group", async () => {
    const result = await removeQueriesFromGroup(TEST_GROUP_ID, [
      TEST_QUERY_1_ID,
    ]);
    expect(result.items.length).toBe(1);

    const updatedQueries = await getAllGroupQueries(TEST_GROUP_ID);
    expect(updatedQueries.items.length).toBe(0);
    expect(
      updatedQueries.items.some(
        (query) =>
          query.queryId === TEST_QUERY_1_ID &&
          query.groupAssignments?.some((q) => q.isMember),
      ),
    ).toBe(false);
  });

  test("should not remove a query that is not in the group", async () => {
    const result = await removeQueriesFromGroup(TEST_GROUP_ID, [
      TEST_QUERY_1_ID,
    ]);
    expect(result.items).toEqual([]);
  });

  /**
   * Tests saving query group memberships.
   */
  test("should return empty array when adding queries with empty list", async () => {
    const result = await addQueriesToGroup(TEST_GROUP_ID, []);
    expect(result.items).toEqual([]);
  });

  test("should return empty array when removing queries with empty list", async () => {
    const result = await removeQueriesFromGroup(TEST_GROUP_ID, []);
    expect(result.items).toEqual([]);
  });

  test("should not remove non-existent query from group", async () => {
    const INVALID_queryId = "99999999-9999-9999-9999-999999999999";
    const result = await removeQueriesFromGroup(TEST_GROUP_ID, [
      INVALID_queryId,
    ]);

    expect(result.items).toEqual([]);
  });

  test("should return empty result when querying a non-existent group", async () => {
    const INVALID_GROUP_ID = "99999999-9999-9999-9999-999999999999";
    const result = await getAllGroupQueries(INVALID_GROUP_ID);

    expect(result.items).toEqual([]);
  });
});
