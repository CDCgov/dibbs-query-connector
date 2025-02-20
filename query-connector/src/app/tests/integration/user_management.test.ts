import {
  createUserGroup,
  getUserGroups,
  updateUserGroup,
  deleteUserGroup,
} from "@/app/backend/user-management";
import { getDbClient } from "../../backend/dbClient";
import { auth } from "@/auth";

const dbClient = getDbClient();
jest.mock("../../../auth", () => ({
  auth: jest.fn(),
}));
const RANDOM_USER_ID = "13e1efb2-5889-4157-8f34-78d7f02dbf84";
(auth as jest.Mock).mockResolvedValue({
  id: RANDOM_USER_ID,
  username: "Ima User",
  firstName: "Ima",
  lastName: "User",
  role: "Super Admin",
});

describe("User Group Integration Tests", () => {
  let testGroupId: string;

  beforeAll(async () => {
    await dbClient.query("BEGIN"); // Start transaction to rollback later
  });

  afterAll(async () => {
    await dbClient.query("ROLLBACK"); // Rollback changes to keep test DB clean
  });

  test.only("should create a new user group", async () => {
    const groupName = "Test Group";
    const result = await createUserGroup(groupName);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("name", groupName);
    expect(result).toHaveProperty("memberSize", 0);
    expect(result).toHaveProperty("querySize", 0);

    if (typeof result === "string") {
      throw new Error(`Failed to create test group: ${result}`);
    }

    testGroupId = result.id;
  });

  test("should not create duplicate user group", async () => {
    const groupName = "Test Group";
    const result = await createUserGroup(groupName);

    expect(result).toBe(`Group '${groupName}' already exists.`);
  });

  test("should retrieve user groups", async () => {
    const result = await getUserGroups();
    expect(result.items?.length).toBeGreaterThanOrEqual(1);
  });

  test("should update a user group name", async () => {
    const newName = "Updated Group Name";
    const result = await updateUserGroup(testGroupId, newName);

    expect(result).toHaveProperty("id", testGroupId);
    expect(result).toHaveProperty("name", newName);
  });

  test("should delete a user group", async () => {
    const result = await deleteUserGroup(testGroupId);
    expect(result).toHaveProperty("id", testGroupId);
  });

  test("should not update a non-existent user group", async () => {
    const result = await updateUserGroup("non-existent-id", "New Name");
    expect(result).toBe(`User group with ID 'non-existent-id' not found.`);
  });

  test("should not delete a non-existent user group", async () => {
    const result = await deleteUserGroup("non-existent-id");
    expect(result).toBe(`User group with ID 'non-existent-id' not found.`);
  });
});
