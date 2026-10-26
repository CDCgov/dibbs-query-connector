jest.mock("@/app/backend/db/decorators/auth");
jest.mock("@/app/backend/audit-logs/decorator");
const mockSpy = auth as jest.Mock;

import {
  addUsersToGroup,
  addQueriesToGroup,
  getAllGroupMembers,
  getAllGroupQueries,
  removeUsersFromGroup,
  removeQueriesFromGroup,
} from "@/app/backend/usergroup-management";
import { getAllUsersWithSingleGroupStatus } from "@/app/backend/user-management";
import { dontUseOutsideConfigOrTests_getDbPool } from "@/app/backend/db/config";
import { User } from "@/app/models/entities/users";
import {
  suppressConsoleLogs,
  TEST_USER_STANDARD_TWO,
  TEST_USER_STANDARD_THREE,
  TEST_USER_STANDARD_FOUR,
  TEST_USER_ADMIN,
  TEST_USER_STANDARD_FIVE,
  TEST_USER_SUPER_TWO,
} from "../fixtures";
import { QueryDataColumn } from "@/app/(pages)/queryBuilding/utils";
import { resetMocksToDefault } from "../mocks";
import { setMockAccessAllowed } from "@/app/backend/db/decorators/__mocks__/auth";
import {
  getQueriesForUser,
  getSavedQuerySummaries,
} from "@/app/backend/query-building/service";
import { CustomUserQuery } from "@/app/models/entities/query";
import { auth } from "@/auth";

const dbClient = dontUseOutsideConfigOrTests_getDbPool();

const TEST_GROUP_ID = "16991d55-5a8a-4463-9c9d-2097a99dd5f1";
const TEST_QUERY_1_ID = "8977d3db-7d72-4613-8901-7a5227cd3fb1";
const TEST_QUERY_2_ID = "10819de2-996f-4eb2-898f-6a31e3765029";
const TEST_QUERY_3_ID = "686789b7-5f51-4531-8d43-a007c3ee9455";
const TEST_QUERY_CONDITIONS: string[] = [];
const TEST_QUERY_DATA: QueryDataColumn = {};

const TEST_USER_1_ID = TEST_USER_STANDARD_FOUR.id;
const TEST_USER_2_ID = TEST_USER_STANDARD_TWO.id;
const TEST_USER_3_ID = TEST_USER_STANDARD_THREE.id;

describe("User Group and Query Membership Tests", () => {
  beforeAll(async () => {
    // Insert test users
    const insertUsersQuery = `
      INSERT INTO users (id, username, first_name, last_name, qc_role)
      VALUES
      ('${TEST_USER_STANDARD_TWO.id}', '${TEST_USER_STANDARD_TWO.username}', '${TEST_USER_STANDARD_TWO.firstName}', '${TEST_USER_STANDARD_TWO.lastName}', '${TEST_USER_STANDARD_TWO.qcRole}'),
      ('${TEST_USER_STANDARD_THREE.id}', '${TEST_USER_STANDARD_THREE.username}', '${TEST_USER_STANDARD_THREE.firstName}', '${TEST_USER_STANDARD_THREE.lastName}', '${TEST_USER_STANDARD_THREE.qcRole}'),
      ('${TEST_USER_STANDARD_FOUR.id}', '${TEST_USER_STANDARD_FOUR.username}', '${TEST_USER_STANDARD_FOUR.firstName}', '${TEST_USER_STANDARD_FOUR.lastName}', '${TEST_USER_STANDARD_FOUR.qcRole}'),
      ('${TEST_USER_STANDARD_FIVE.id}', '${TEST_USER_STANDARD_FIVE.username}', '${TEST_USER_STANDARD_FIVE.firstName}', '${TEST_USER_STANDARD_FIVE.lastName}', '${TEST_USER_STANDARD_FIVE.qcRole}'),
      ('${TEST_USER_ADMIN.id}', '${TEST_USER_ADMIN.username}', '${TEST_USER_ADMIN.firstName}', '${TEST_USER_ADMIN.lastName}', '${TEST_USER_ADMIN.qcRole}'),
      ('${TEST_USER_SUPER_TWO.id}', '${TEST_USER_SUPER_TWO.username}', '${TEST_USER_SUPER_TWO.firstName}', '${TEST_USER_SUPER_TWO.lastName}', '${TEST_USER_SUPER_TWO.qcRole}')
   
      ON CONFLICT DO NOTHING;
    `;
    await dbClient.query(insertUsersQuery);

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

  beforeEach(() => {
    resetMocksToDefault();
    suppressConsoleLogs();
  });

  afterAll(async () => {
    const deleteUsergroupToQueriesQuery = `
      DELETE FROM usergroup_to_query 
      WHERE query_id IN ($1, $2);
    `;
    await dbClient.query(deleteUsergroupToQueriesQuery, [
      TEST_QUERY_3_ID,
      TEST_QUERY_2_ID,
    ]);

    const deleteQueriesQuery = `
      DELETE FROM query 
      WHERE id IN ($1, $2, $3);
    `;
    await dbClient.query(deleteQueriesQuery, [
      TEST_QUERY_2_ID,
      TEST_QUERY_3_ID,
    ]);

    const deleteUsersToUsergroupQuery = `
      DELETE FROM usergroup_to_users 
      WHERE user_id IN 
        ('${TEST_USER_STANDARD_TWO.id}', '${TEST_USER_STANDARD_THREE.id}', '${TEST_USER_STANDARD_FOUR.id}', '${TEST_USER_STANDARD_FIVE.id}', '${TEST_USER_ADMIN.id}', '${TEST_USER_SUPER_TWO.id}');
    `;
    await dbClient.query(deleteUsersToUsergroupQuery);

    const deleteGroupQuery = `
      DELETE FROM usergroup 
      WHERE id = $1;
    `;
    await dbClient.query(deleteGroupQuery, [TEST_GROUP_ID]);

    const deleteUsersQuery = `
      DELETE FROM users 
      WHERE id IN 
        ('${TEST_USER_STANDARD_TWO.id}', '${TEST_USER_STANDARD_THREE.id}', '${TEST_USER_STANDARD_FOUR.id}', '${TEST_USER_STANDARD_FIVE.id}', '${TEST_USER_ADMIN.id}', '${TEST_USER_SUPER_TWO.id}');
    `;
    await dbClient.query(deleteUsersQuery);
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
    );
    expect(membership).toBeDefined();
    expect(membership?.isMember).toBeDefined();
  });

  test("should add multiple queries to a group", async () => {
    mockSpy.mockResolvedValue({ user: TEST_USER_ADMIN });

    setMockAccessAllowed({
      auth: true,
      admin: true,
      super: false,
    });

    const result = await addQueriesToGroup(TEST_GROUP_ID, [
      TEST_QUERY_2_ID,
      TEST_QUERY_3_ID,
    ]);

    expect(result.totalItems).toBe(2);
    expect(
      result.items.some((query) => query.queryId === TEST_QUERY_2_ID),
    ).toBe(true);
    expect(
      result.items.some((query) => query.queryId === TEST_QUERY_3_ID),
    ).toBe(true);

    const queriesList = (await getAllGroupQueries(TEST_GROUP_ID)).items;

    expect(queriesList.length).toBe(2);
    expect(queriesList.some((query) => query.queryId === TEST_QUERY_2_ID)).toBe(
      true,
    );
    expect(queriesList.some((query) => query.queryId === TEST_QUERY_3_ID)).toBe(
      true,
    );

    // Verify querying by user returns the assigned queries
    await addUsersToGroup(TEST_GROUP_ID, [TEST_USER_ADMIN.id]);

    const usersToCheck: User[] =
      await getAllUsersWithSingleGroupStatus(TEST_GROUP_ID);

    const testUser = usersToCheck.find(
      (u) => u.username === TEST_USER_ADMIN.username,
    )!;
    const testUserFilteredQueries = await getQueriesForUser(testUser);

    expect(testUserFilteredQueries).toBeDefined();
    expect((testUserFilteredQueries as CustomUserQuery[]).length).toBe(2);
    expect(
      (testUserFilteredQueries as CustomUserQuery[]).some(
        (query) => query.queryId === TEST_QUERY_2_ID,
      ),
    ).toBe(true);
    expect(
      (testUserFilteredQueries as CustomUserQuery[]).some(
        (query) => query.queryId === TEST_QUERY_3_ID,
      ),
    ).toBe(true);
  });

  test("should restrict query summaries for a standard user to their group's queries", async () => {
    // have the admin user add the standard user to the group in question
    mockSpy.mockResolvedValue({ user: TEST_USER_ADMIN });
    setMockAccessAllowed({
      auth: true,
      admin: true,
      super: false,
    });

    await addUsersToGroup(TEST_GROUP_ID, [TEST_USER_STANDARD_THREE.id]);

    // query the group using the standard user
    mockSpy.mockResolvedValue({ user: TEST_USER_STANDARD_THREE });
    setMockAccessAllowed({
      auth: true,
      admin: false,
      super: false,
    });

    await addQueriesToGroup(TEST_GROUP_ID, [TEST_QUERY_2_ID, TEST_QUERY_3_ID]);

    const summaries = await getSavedQuerySummaries();
    expect(summaries.length).toBe(2);
    expect(summaries.map((s) => s.queryId).sort()).toEqual(
      [TEST_QUERY_2_ID, TEST_QUERY_3_ID].sort(),
    );
    expect(Object.keys(summaries[0]).sort()).toEqual(["queryId", "queryName"]);
  });

  test("should return all queries in summaries for a super admin", async () => {
    mockSpy.mockResolvedValue({ user: TEST_USER_SUPER_TWO });

    setMockAccessAllowed({
      auth: true,
      admin: true,
      super: true,
    });

    const summaries = await getSavedQuerySummaries();
    const summaryIds = summaries.map((s) => s.queryId);

    [TEST_QUERY_1_ID, TEST_QUERY_2_ID, TEST_QUERY_3_ID].forEach((queryId) => {
      expect(summaryIds).toContain(queryId);
    });
  });
});
