import {
  addUserIfNotExists,
  updateUserRole,
  getUsers,
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
  username: "WorfSonOfMogh",
  email: "worf_security@starfleet.com",
  firstName: "Worf",
  lastName: "Mogh",
  role: 
};

(auth as jest.Mock).mockResolvedValue(TEST_USER);

describe("Audit Logging Integration Tests", () => {
  beforeAll(async () => {
    await dbClient.query("BEGIN");
  });

  afterAll(async () => {
    await dbClient.query("ROLLBACK");
  });

  test("should find user and know their role", async () => {
    const result = await addUserIfNotExists(TEST_USER);

    expect(result.items![0]).toHaveProperty(
      "qc_role",
      RoleTypeValues.Admin,
    );
  });
});