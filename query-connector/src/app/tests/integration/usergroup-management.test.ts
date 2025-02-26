import {
  getUsersWithGroupStatus,
  addUsersToGroup,
  removeUsersFromGroup,
  saveUserGroupMembership,
} from "@/app/backend/usergroup-management";
import { getDbClient } from "@/app/backend/dbClient";
import { User } from "@/app/models/entities/user-management";

const dbClient = getDbClient();

jest.mock("@/app/utils/auth", () => ({
  adminAccessCheck: jest.fn(() => Promise.resolve(true)),
}));

const TEST_GROUP_ID = "00000000-0000-0000-0000-000000000000";
const TEST_USER_1_ID = "00000000-0000-0000-0000-000000000001";
const TEST_USER_2_ID = "00000000-0000-0000-0000-000000000002";

describe("User Group Membership Tests", () => {
  beforeAll(async () => {
    await dbClient.query("BEGIN");

    // Insert test users
    const insertUsersQuery = `
      INSERT INTO users (id, username, first_name, last_name, qc_role)
      VALUES 
        ($1, 'testuser1', 'Test', 'User1', 'Standard User'),
        ($2, 'testuser2', 'Test', 'User2', 'Standard User');
    `;
    await dbClient.query(insertUsersQuery, [TEST_USER_1_ID, TEST_USER_2_ID]);

    // Insert test group
    const insertGroupQuery = `
      INSERT INTO usergroup (id, name)
      VALUES ($1, 'Test Group');
    `;
    await dbClient.query(insertGroupQuery, [TEST_GROUP_ID]);
  });

  afterAll(async () => {
    try {
      await dbClient.query(
        "DELETE FROM usergroup_to_users WHERE usergroup_id = $1;",
        [TEST_GROUP_ID],
      );
      await dbClient.query("DELETE FROM usergroup WHERE id = $1;", [
        TEST_GROUP_ID,
      ]);
      await dbClient.query("DELETE FROM users WHERE id IN ($1, $2);", [
        TEST_USER_1_ID,
        TEST_USER_2_ID,
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
    const result: User[] = await getUsersWithGroupStatus(TEST_GROUP_ID);

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0 && result[0] && typeof result[0] === "object") {
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("username");
      expect(result[0]).toHaveProperty("userGroupMemberships");

      const membership = result[0].userGroupMemberships?.find(
        (m) => m.usergroup_id === TEST_GROUP_ID,
      );
      expect(membership).toBeDefined();
      expect(membership?.is_member).toBeDefined();
    }
  });

  /**
   * Tests adding users to a user group.
   */
  test("should add users to a group", async () => {
    const result = await addUsersToGroup(TEST_GROUP_ID, [
      TEST_USER_1_ID,
      TEST_USER_2_ID,
    ]);
    expect(result).toContain(TEST_USER_1_ID);
    expect(result).toContain(TEST_USER_2_ID);
    expect(result.length).toBe(2);

    const updatedUsers = await getUsersWithGroupStatus(TEST_GROUP_ID);
    const members = updatedUsers.filter((user) =>
      user.userGroupMemberships?.some((m) => m.is_member),
    );

    expect(members.length).toBe(2);
    expect(members.some((user) => user.id === TEST_USER_1_ID)).toBe(true);
    expect(members.some((user) => user.id === TEST_USER_2_ID)).toBe(true);
  });

  /**
   * Tests removing users from a user group.
   */
  test("should remove users from a group", async () => {
    const result = await removeUsersFromGroup(TEST_GROUP_ID, [
      TEST_USER_1_ID,
      TEST_USER_2_ID,
    ]);
    expect(result).toContain(TEST_USER_1_ID);
    expect(result).toContain(TEST_USER_2_ID);

    const updatedUsers = await getUsersWithGroupStatus(TEST_GROUP_ID);
    const members = updatedUsers.filter((user) =>
      user.userGroupMemberships?.some((m) => m.is_member),
    );

    expect(members.length).toBe(0);
    expect(
      updatedUsers.some(
        (user) =>
          user.id === TEST_USER_1_ID &&
          user.userGroupMemberships?.some((m) => m.is_member),
      ),
    ).toBe(false);
    expect(
      updatedUsers.some(
        (user) =>
          user.id === TEST_USER_2_ID &&
          user.userGroupMemberships?.some((m) => m.is_member),
      ),
    ).toBe(false);
  });

  /**
   * Tests saving user group memberships.
   */
  test("should correctly update user group memberships", async () => {
    const selectedUsers = [TEST_USER_1_ID];

    // Add and remove users in one call
    const updatedUsers = await saveUserGroupMembership(
      TEST_GROUP_ID,
      selectedUsers,
    );

    // Verify membership contains only selected users
    expect(
      updatedUsers.some(
        (user) =>
          user.id === TEST_USER_1_ID &&
          user.userGroupMemberships?.some((m) => m.is_member),
      ),
    ).toBe(true);
    expect(
      updatedUsers.some(
        (user) =>
          user.id === TEST_USER_2_ID &&
          user.userGroupMemberships?.some((m) => m.is_member),
      ),
    ).toBe(false);
  });

  test("should return empty array when adding users with empty list", async () => {
    const result = await addUsersToGroup(TEST_GROUP_ID, []);
    expect(result).toEqual([]);
  });

  test("should return empty array when removing users with empty list", async () => {
    const result = await removeUsersFromGroup(TEST_GROUP_ID, []);
    expect(result).toEqual([]);
  });

  test("should not add non-existent user to group", async () => {
    const INVALID_USER_ID = "99999999-9999-9999-9999-999999999999";
    const result = await addUsersToGroup(TEST_GROUP_ID, [INVALID_USER_ID]);

    expect(result).toEqual([]);
  });

  test("should not remove non-existent user from group", async () => {
    const INVALID_USER_ID = "99999999-9999-9999-9999-999999999999";
    const result = await removeUsersFromGroup(TEST_GROUP_ID, [INVALID_USER_ID]);

    expect(result).toEqual([]);
  });

  test("should return empty result when querying a non-existent group", async () => {
    const INVALID_GROUP_ID = "99999999-9999-9999-9999-999999999999";
    const result = await getUsersWithGroupStatus(INVALID_GROUP_ID);

    expect(result).toEqual([]);
  });
});
