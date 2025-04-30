import {
  addQueriesToGroup,
  getAllGroupQueries,
} from "@/app/backend/usergroup-management";
import { getAllUsersWithSingleGroupStatus } from "@/app/backend/user-management";
import { getDbClient } from "@/app/backend/dbClient";
import { User } from "@/app/models/entities/users";
import { suppressConsoleLogs } from "./fixtures";
import { QueryDataColumn } from "@/app/(pages)/queryBuilding/utils";
import { getQueriesForUser } from "@/app/backend/query-building";
import { CustomUserQuery } from "@/app/models/entities/query";

const dbClient = getDbClient();

jest.mock("@/app/utils/auth", () => ({
  superAdminAccessCheck: jest.fn(() => Promise.resolve(true)),
  adminAccessCheck: jest.fn(() => Promise.resolve(true)),
}));

const TEST_GROUP_ID = "00000000-0000-0000-0000-000000000007";
const TEST_USER_1_ID = "00000000-0000-0000-0000-000000000012";
const TEST_USER_2_ID = "00000000-0000-0000-0000-000000000013";
const TEST_QUERY_1_ID = "00000000-0000-0000-0000-000000000015";
const TEST_QUERY_2_ID = "00000000-0000-0000-0000-000000000016";
const TEST_QUERY_3_ID = "00000000-0000-0000-0000-000000000017";
const TEST_QUERY_CONDITIONS: string[] = [];
const TEST_QUERY_DATA: QueryDataColumn = {};

describe("User Group and Query Membership Tests", () => {
  beforeAll(async () => {
    suppressConsoleLogs();

    await dbClient.query("BEGIN");

    // Insert test users
    const insertUsersQuery = `
      INSERT INTO users (id, username, first_name, last_name, qc_role)
      VALUES
        ($1, 'QtheMagnificent', 'Q', 'Omnipotent', 'Super Admin'),
        ($2, 'mamaTroi', 'Lwaxana', 'Troi', 'Standard User');
    `;
    await dbClient.query(insertUsersQuery, [TEST_USER_1_ID, TEST_USER_2_ID]);

    // Insert test group
    const insertGroupQuery = `
      INSERT INTO usergroup (id, name)
      VALUES ($1, 'Enterprise Visitors');
    `;
    await dbClient.query(insertGroupQuery, [TEST_GROUP_ID]);

    // Insert test queries
    const insertQueryQuery = `INSERT INTO query (id, query_name, conditions_list, query_data)
    VALUES
      ($1, 'Where is Jean Luc Picard?', $4, $5),
      ($2, 'Eaten any good books lately?', $4, $5),
      ($3, 'Darling, dont be silly.', $4, $5);
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
      await dbClient.query("DELETE FROM users WHERE id IN ($1, $2);", [
        TEST_USER_1_ID,
        TEST_USER_2_ID,
      ]);
      await dbClient.query("DELETE FROM query WHERE id IN ($1, $2, $3);", [
        TEST_QUERY_1_ID,
        TEST_QUERY_2_ID,
        TEST_QUERY_3_ID,
      ]);
      await dbClient.query("ROLLBACK");
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
    await dbClient.query("COMMIT");

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
   * Tests adding queries to a user group.
   */
  test("should add multiple queries to a group", async () => {
    const result = await addQueriesToGroup(TEST_GROUP_ID, [
      TEST_QUERY_2_ID,
      TEST_QUERY_3_ID,
    ]);
    await dbClient.query("COMMIT");

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

    // check that querying by user returns the right queries
    const usersToCheck: User[] =
      await getAllUsersWithSingleGroupStatus(TEST_GROUP_ID);

    const testUser = usersToCheck.filter(
      (u) => u.username === "QtheMagnificent",
    )[0];
    const testUserFilteredQueries = await getQueriesForUser(testUser);

    expect(testUserFilteredQueries).toBeDefined();
    expect((testUserFilteredQueries as CustomUserQuery[]).length).toBe(2);
    expect(
      (testUserFilteredQueries as CustomUserQuery[]).some(
        (query) => query.queryId == TEST_QUERY_2_ID,
      ),
    ).toBe(true);
    expect(
      (testUserFilteredQueries as CustomUserQuery[]).some(
        (query) => query.queryId == TEST_QUERY_3_ID,
      ),
    ).toBe(true);
  });

  //tests for superAdmins and them seeing evertyhing
  //tests for other logged in users to make sure they do NOT see everything
});
