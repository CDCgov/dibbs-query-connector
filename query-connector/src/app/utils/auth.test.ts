import { auth } from "@/auth";
import { User } from "next-auth";
import { getUserRole } from "@/app/backend/user-management";
import { UserRole } from "@/app/models/entities/user-management";
import {
  isDemoMode,
  isAuthDisabledClientCheck,
  isAuthDisabledServerCheck,
  getLoggedInUser,
  superAdminAccessCheck,
  adminAccessCheck,
} from "@/app/utils/auth";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/app/backend/user-management", () => ({
  getUserRole: jest.fn(),
}));

const TEST_USER: User = {
  id: "test-user-id",
  username: "testuser",
  email: "testuser@example.com",
  name: "Test User",
};

/**
 * Tests for environment-based authentication settings
 */
describe("Authentication Utilities", () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.DEMO_MODE;
    delete process.env.AUTH_DISABLED;
  });

  /**
   * Tests for isDemoMode()
   */
  test("should return true if DEMO_MODE is enabled", () => {
    process.env.DEMO_MODE = "true";
    expect(isDemoMode()).toBe(true);
  });

  test("should return false if DEMO_MODE is not set", () => {
    expect(isDemoMode()).toBe(false);
  });

  /**
   * Tests for isAuthDisabledClientCheck()
   */
  test("should return true if AUTH_DISABLED is enabled on the client", () => {
    const runtimeConfig = { AUTH_DISABLED: "true" };
    expect(isAuthDisabledClientCheck(runtimeConfig)).toBe(true);
  });

  test("should return false if AUTH_DISABLED is not set on the client", () => {
    expect(isAuthDisabledClientCheck(undefined)).toBe(false);
  });

  /**
   * Tests for isAuthDisabledServerCheck()
   */
  test("should return true if AUTH_DISABLED is enabled on the server", () => {
    process.env.AUTH_DISABLED = "true";
    expect(isAuthDisabledServerCheck()).toBe(true);
  });

  test("should return false if AUTH_DISABLED is not set on the server", () => {
    expect(isAuthDisabledServerCheck()).toBe(false);
  });

  /**
   * Tests for getLoggedInUser()
   */
  test("should return user object if user is authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: TEST_USER });
    const user = await getLoggedInUser();
    expect(user).toEqual(TEST_USER);
  });

  test("should return undefined if no user is authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const user = await getLoggedInUser();
    expect(user).toBeUndefined();
  });

  /**
   * Tests for superAdminAccessCheck()
   */
  describe("superAdminAccessCheck", () => {
    test("should return true if AUTH_DISABLED is enabled", async () => {
      process.env.AUTH_DISABLED = "true";
      expect(await superAdminAccessCheck()).toBe(true);
    });

    test("should return true if user is a super admin", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: TEST_USER });
      (getUserRole as jest.Mock).mockResolvedValue(UserRole.SUPER_ADMIN);

      expect(await superAdminAccessCheck()).toBe(true);
    });

    test("should return false if user is not a super admin", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: TEST_USER });
      (getUserRole as jest.Mock).mockResolvedValue(UserRole.STANDARD);

      expect(await superAdminAccessCheck()).toBe(false);
    });

    test("should return false if no user is logged in", async () => {
      (auth as jest.Mock).mockResolvedValue(null);
      expect(await superAdminAccessCheck()).toBe(false);
    });
  });

  /**
   * Tests for adminAccessCheck()
   */
  describe("adminAccessCheck", () => {
    test("should return true if AUTH_DISABLED is enabled", async () => {
      process.env.AUTH_DISABLED = "true";
      expect(await adminAccessCheck()).toBe(true);
    });

    test("should return true if user is an admin", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: TEST_USER });
      (getUserRole as jest.Mock).mockResolvedValue(UserRole.ADMIN);

      expect(await adminAccessCheck()).toBe(true);
    });

    test("should return true if user is a super admin", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: TEST_USER });
      (getUserRole as jest.Mock).mockResolvedValue(UserRole.SUPER_ADMIN);

      expect(await adminAccessCheck()).toBe(true);
    });

    test("should return false if user is not an admin or super admin", async () => {
      (auth as jest.Mock).mockResolvedValue({ user: TEST_USER });
      (getUserRole as jest.Mock).mockResolvedValue(UserRole.STANDARD);

      expect(await adminAccessCheck()).toBe(false);
    });

    test("should return false if no user is logged in", async () => {
      (auth as jest.Mock).mockResolvedValue(null);
      expect(await adminAccessCheck()).toBe(false);
    });
  });
});
