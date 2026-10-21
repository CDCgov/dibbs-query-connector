import {
  addQueriesToGroup,
  addUsersToGroup,
  getAllGroupQueries,
} from "@/app/backend/usergroup-management";
import { getAllUsersWithSingleGroupStatus } from "@/app/backend/user-management";
import { dontUseOutsideConfigOrTests_getDbPool } from "@/app/backend/db/config";
import { User } from "@/app/models/entities/users";
import {
  suppressConsoleLogs,
  TEST_USER_ADMIN,
  TEST_USER_STANDARD,
  TEST_USER_STANDARD_TWO,
  TEST_USER_SUPER,
} from "./fixtures";
import { QueryDataColumn } from "@/app/(pages)/queryBuilding/utils";
import {
  getQueriesForUser,
  getSavedQuerySummaries,
} from "@/app/backend/query-building/service";
import { CustomUserQuery } from "@/app/models/entities/query";
import { setMockAccessAllowed } from "@/app/backend/db/decorators/__mocks__/auth";
import { auth } from "@/auth";

const dbClient = dontUseOutsideConfigOrTests_getDbPool();

jest.mock("@/app/backend/db/decorators/auth");
jest.mock("@/app/backend/audit-logs/decorator");

const TEST_GROUP_ID = "00000000-0000-0000-0000-000000000007";
const TEST_QUERY_1_ID = "00000000-0000-0000-0000-000000000015";
const TEST_QUERY_2_ID = "00000000-0000-0000-0000-000000000016";
const TEST_QUERY_3_ID = "00000000-0000-0000-0000-000000000017";
const TEST_QUERY_CONDITIONS: string[] = [];
const TEST_QUERY_DATA: QueryDataColumn = {};

describe("User Group and Query Membership Tests", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });

  beforeEach(async () => {
    // Seed test users
    const insertUsersQuery = `
      INSERT INTO users (id, username, first_name, last_name, qc_role)
      VALUES
      ('${TEST_USER_SUPER.id}', '${TEST_USER_SUPER.username}', '${TEST_USER_SUPER.firstName}', '${TEST_USER_SUPER.lastName}', '${TEST_USER_SUPER.qcRole}'),
      ('${TEST_USER_STANDARD.id}', '${TEST_USER_STANDARD.username}', '${TEST_USER_STANDARD.firstName}', '${TEST_USER_STANDARD.lastName}', '${TEST_USER_STANDARD.qcRole}'),
      ('${TEST_USER_ADMIN.id}', '${TEST_USER_ADMIN.username}', '${TEST_USER_ADMIN.firstName}', '${TEST_USER_ADMIN.lastName}', '${TEST_USER_ADMIN.qcRole}');
    `;
    await dbClient.query(insertUsersQuery);

    // Seed test group
    const insertGroupQuery = `
      INSERT INTO usergroup (id, name)
      VALUES ($1, 'Mushroom Kingdom');
    `;
    await dbClient.query(insertGroupQuery, [TEST_GROUP_ID]);

    // Seed test queries
    const insertQueryQuery = `
      INSERT INTO query (id, query_name, conditions_list, query_data)
      VALUES
        ($1, 'Wahoooo!', $4, $5),
        ($2, 'Its a me, Mario', $4, $5),
        ($3, 'So long, King Bowser', $4, $5);
    `;
    await dbClient.query(insertQueryQuery, [
      TEST_QUERY_1_ID,
      TEST_QUERY_2_ID,
      TEST_QUERY_3_ID,
      TEST_QUERY_CONDITIONS,
      TEST_QUERY_DATA,
    ]);
  });

  afterEach(async () => {
    await dbClient.query(
      "TRUNCATE TABLE usergroup, users, query RESTART IDENTITY CASCADE;",
    );

    jest.clearAllMocks();
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
    (auth as jest.Mock).mockResolvedValue({ user: TEST_USER_ADMIN });

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
    (auth as jest.Mock).mockResolvedValue({ user: TEST_USER_STANDARD_TWO });
    setMockAccessAllowed({
      auth: true,
      admin: false,
      super: false,
    });

    await addQueriesToGroup(TEST_GROUP_ID, [TEST_QUERY_2_ID, TEST_QUERY_3_ID]);
    await addUsersToGroup(TEST_GROUP_ID, [TEST_USER_STANDARD_TWO.id]);

    const summaries = await getSavedQuerySummaries();

    expect(summaries.length).toBe(2);
    expect(summaries.map((s) => s.queryId).sort()).toEqual(
      [TEST_QUERY_2_ID, TEST_QUERY_3_ID].sort(),
    );
    expect(Object.keys(summaries[0]).sort()).toEqual(["queryId", "queryName"]);
  });

  test("should return all queries in summaries for a super admin", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: TEST_USER_SUPER });

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
