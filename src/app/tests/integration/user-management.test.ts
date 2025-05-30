import {
  addUserIfNotExists,
  updateUserRole,
  getAllUsers,
  getUserRole,
  getUserByUsername,
  updateUserDetails,
  getAllAdmins,
} from "@/app/backend/user-management";

import {
  createUserGroup,
  getAllUserGroups,
  updateUserGroup,
  deleteUserGroup,
} from "@/app/backend/usergroup-management";

import { internal_getDbClient } from "@/app/backend/db/config";
import { UserRole } from "@/app/models/entities/users";
import { suppressConsoleLogs } from "./fixtures";

const dbClient = internal_getDbClient();

jest.mock("@/app/utils/auth", () => {
  return {
    superAdminAccessCheck: jest.fn().mockResolvedValue(true),
    adminAccessCheck: jest.fn().mockResolvedValue(true),
  };
});

const TEST_USER_STANDARD = {
  id: "13e1efb2-5889-4157-8f34-78d7f02dbf84",
  username: "yoshi",
  firstName: "Green",
  lastName: "Yoshi",
  qcRole: UserRole.STANDARD,
};

const TEST_USER_SUPER = {
  id: "7dd8b2a7-658c-4152-afcd-8b514fb5343b",
  username: "luigi",
  firstName: "Lugi",
  lastName: "Mario",
  qcRole: UserRole.SUPER_ADMIN,
};

describe("User Management Integration Tests", () => {
  beforeEach(async () => {
    suppressConsoleLogs();

    // Insert first user as super admin
    const insertSuperUsersQuery = `
     INSERT INTO users (id, username, first_name, last_name, qc_role)
     VALUES 
       ($1, $2, $3, $4, $5);
   `;
    await dbClient.query(insertSuperUsersQuery, [
      TEST_USER_SUPER.id,
      TEST_USER_SUPER.username,
      TEST_USER_SUPER.firstName,
      TEST_USER_SUPER.lastName,
      TEST_USER_SUPER.qcRole,
    ]);
  });

  afterEach(async () => {
    try {
      await dbClient.query("DELETE FROM users WHERE username = $1;", [
        TEST_USER_STANDARD.username,
      ]);
      await dbClient.query("DELETE FROM users WHERE username = $1;", [
        TEST_USER_SUPER.username,
      ]);
      await dbClient.query("DELETE FROM users WHERE id = $1;", [
        TEST_USER_SUPER.id,
      ]);
    } catch (error) {
      console.error("Rollback failed:", error);
    }
  });

  /**
   * Tests adding a new user if they do not already exist.
   */
  test("should add a user if they do not exist and update them after if specified", async () => {
    const { user } = await addUserIfNotExists(TEST_USER_STANDARD);

    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("username", TEST_USER_STANDARD.username);
    expect(user).toHaveProperty("qcRole", UserRole.STANDARD);

    const updatedToken = structuredClone(TEST_USER_STANDARD);
    updatedToken.qcRole = UserRole.ADMIN;
    const { user: newUser } = await addUserIfNotExists(updatedToken, true);
    expect(newUser).toHaveProperty("qcRole", UserRole.ADMIN);
  });
  /**
   * Tests getting a user by username.
   */
  test("get user by username", async () => {
    await addUserIfNotExists(TEST_USER_STANDARD);
    const result = await getUserByUsername(TEST_USER_STANDARD.username);

    const user = result.items[0];
    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("username", TEST_USER_STANDARD.username);
    expect(user).toHaveProperty("qcRole", UserRole.STANDARD);
  });

  /**
   * Tests updating the role of an existing user.
   */
  test("should update a user's role", async () => {
    const { user } = await addUserIfNotExists(TEST_USER_STANDARD);
    const result = await updateUserRole(user.id, UserRole.SUPER_ADMIN);

    expect(result.items).not.toBeNull();
    expect(result.items![0]).toHaveProperty("qcRole", UserRole.SUPER_ADMIN);
  });
  /**
   * Tests updating the details of an existing user.
   */
  test("should update a user's details", async () => {
    const { user } = await addUserIfNotExists(TEST_USER_SUPER);

    const initial = await getUserByUsername(TEST_USER_SUPER.username);
    expect(initial.items[0]).toHaveProperty(
      "lastName",
      TEST_USER_SUPER.lastName,
    );

    const result = await updateUserDetails(
      user.id,
      TEST_USER_SUPER.username,
      TEST_USER_SUPER.firstName,
      "Its A Me",
      UserRole.SUPER_ADMIN,
    );

    expect(result).toHaveProperty("username", TEST_USER_SUPER.username);
    expect(result).toHaveProperty("lastName", "Its A Me");
  });

  /**
   * Tests retrieving a user's role by username.
   */
  test("should retrieve user role by username", async () => {
    await addUserIfNotExists(TEST_USER_SUPER);

    const result = await getUserRole(TEST_USER_SUPER.username);
    expect(result).toBe(UserRole.SUPER_ADMIN);
  });

  /**
   * Tests retrieving all registered users.
   */
  test("should retrieve all users", async () => {
    const result = await getAllUsers();
    expect(result.items.includes(TEST_USER_STANDARD));
    expect(result.items.includes(TEST_USER_SUPER));

    const adminResults = await getAllAdmins();
    expect(adminResults.includes(TEST_USER_SUPER));
    expect(!adminResults.includes(TEST_USER_STANDARD));
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
    const groupName = "Pilot Group";
    const result = (await createUserGroup(groupName)).items[0];

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("name", groupName);
    expect(result).toHaveProperty("memberSize", 0);
    expect(result).toHaveProperty("querySize", 0);

    if (typeof result === "string") {
      throw new Error(`Failed to create Pilot Group: ${result}`);
    }

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("name", groupName);
    testGroupId = result.id;
  });

  /**
   * Tests preventing duplicate user group creation.
   */
  test("should not create duplicate user group", async () => {
    await expect(createUserGroup("Pilot Group")).rejects.toThrow(
      `User group 'Pilot Group' already exists.`,
    );
  });

  /**
   * Tests retrieving all user groups.
   */
  test("should retrieve user groups", async () => {
    const result = await getAllUserGroups();
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
