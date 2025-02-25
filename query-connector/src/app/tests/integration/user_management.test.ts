import {
  createUserGroup,
  getUserGroups,
  updateUserGroup,
  deleteUserGroup,
  addUserIfNotExists,
  updateUserRole,
  getUsers,
  getUserRole,
} from "@/app/backend/user-management";
import { getDbClient } from "@/app/backend/dbClient";
import { auth } from "@/auth";
import { RoleTypeValues } from "@/app/models/entities/user-management";

const dbClient = getDbClient();
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/app/utils/auth", () => {
  return {
    superAdminAccessCheck: jest.fn(() => Promise.resolve(true)),
    adminAccessCheck: jest.fn(() => Promise.resolve(true)),
  };
});

const TEST_USER = {
  id: "13e1efb2-5889-4157-8f34-78d7f02dbf84",
  username: "Ima User",
  email: "ima.user@example.com",
  firstName: "Ima",
  lastName: "User",
};

const TEST_SUPER_USER = {
  id: "13e1efb2-5889-4157-8f34-78d7f02dbf78",
  username: "Ima OtherUser",
  email: "ima.otheruser@example.com",
  firstName: "Ima",
  lastName: "OtherUser",
};

(auth as jest.Mock).mockResolvedValue(TEST_USER);

describe("User Management Integration Tests", () => {
  let createdUserId: string;

  beforeAll(async () => {
    await dbClient.query("BEGIN");
  });

  afterAll(async () => {
    await dbClient.query("ROLLBACK");
  });

  /**
   * Tests adding a new user if they do not already exist.
   */
  test.each([
    { user: TEST_SUPER_USER, role: RoleTypeValues.SuperAdmin },
    { user: TEST_USER, role: RoleTypeValues.Standard },
  ])("should add a user if they do not exist", async ({ user, role }) => {
    const result = await addUserIfNotExists(user);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("username", user.username);
    expect(result).toHaveProperty("qc_role", role);
    createdUserId = result.id;
  });

  /**
   * Tests updating the role of an existing user.
   */
  test("should update a user's role", async () => {
    const result = await updateUserRole(
      createdUserId,
      RoleTypeValues.SuperAdmin,
    );
    expect(result.items).not.toBeNull();
    expect(result.items![0]).toHaveProperty(
      "qc_role",
      RoleTypeValues.SuperAdmin,
    );
  });

  /**
   * Tests retrieving all registered users.
   */
  test("should retrieve all users", async () => {
    const result = await getUsers();
    expect(result.totalItems).toBeGreaterThan(0);
  });

  /**
   * Tests retrieving a user's role by username.
   */
  test("should retrieve user role by username", async () => {
    const result = await getUserRole(TEST_USER.username);
    expect(result).toBe(RoleTypeValues.SuperAdmin);
  });
});

describe("User Group Integration Tests", () => {
  let testGroupId: string;

  beforeAll(async () => {
    await dbClient.query("BEGIN");
  });

  afterAll(async () => {
    await dbClient.query("ROLLBACK");
  });

  /**
   * Tests creating a new user group.
   */
  test("should create a new user group", async () => {
    const groupName = "Test Group";
    const result = await createUserGroup(groupName);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("name", groupName);
    expect(result).toHaveProperty("memberSize", 0);
    expect(result).toHaveProperty("querySize", 0);

    if (typeof result === "string") {
      throw new Error(`Failed to create test group: ${result}`);
    }

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("name", groupName);
    testGroupId = result.id;
  });

  /**
   * Tests preventing duplicate user group creation.
   */
  test("should not create duplicate user group", async () => {
    const result = await createUserGroup("Test Group");
    expect(typeof result).toBe("string"); // It should return a string error
    expect(result).toBe(`Group 'Test Group' already exists.`);
  });

  /**
   * Tests retrieving all user groups.
   */
  test("should retrieve user groups", async () => {
    const result = await getUserGroups();
    expect(result.items).not.toBeNull();
    expect(result.items!.length).toBeGreaterThanOrEqual(1);
  });

  /**
   * Tests updating a user group's name.
   */
  test("should update a user group name", async () => {
    const result = await updateUserGroup(testGroupId, "Updated Group Name");
    expect(result).toHaveProperty("id", testGroupId);
    expect(result).toHaveProperty("name", "Updated Group Name");
  });

  /**
   * Tests deleting a user group.
   */
  test("should delete a user group", async () => {
    const result = await deleteUserGroup(testGroupId);
    expect(result).toHaveProperty("id", testGroupId);
  });

  const NON_EXISTENT_UUID = "00000000-0000-0000-0000-000000000000";
  /**
   * Tests preventing updates to a non-existent user group.
   */
  test("should not update a non-existent user group", async () => {
    await expect(
      updateUserGroup(NON_EXISTENT_UUID, "New Name"),
    ).rejects.toThrow(`User group with ID '${NON_EXISTENT_UUID}' not found.`);
  });

  /**
   * Tests preventing deletion of a non-existent user group.
   */
  test("should not delete a non-existent user group", async () => {
    await expect(deleteUserGroup(NON_EXISTENT_UUID)).rejects.toThrow(
      `User group with ID '${NON_EXISTENT_UUID}' not found.`,
    );
  });
});
