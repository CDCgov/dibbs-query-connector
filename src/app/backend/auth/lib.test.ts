import type { Account, Profile } from "next-auth";
import type { JWT } from "@auth/core/jwt";
import { UserRole } from "@/app/models/entities/users";
import KeycloakProvider from "next-auth/providers/keycloak";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import PingId from "next-auth/providers/ping-id";

// The class field CLIENT_ID_NAME is captured from process.env.AUTH_CLIENT_ID at
// module-evaluation time, so it must be set BEFORE the module is required below.
process.env.AUTH_CLIENT_ID = "qc-client";

// Break the transitive @/app/utils/auth -> @/auth (NextAuth) import chain and make
// the auth-disabled branch controllable.
const mockIsAuthDisabledServerCheck = jest.fn(() => false);
jest.mock("@/app/utils/auth", () => ({
  isAuthDisabledServerCheck: () => mockIsAuthDisabledServerCheck(),
}));

// keycloak has an automatic manual mock in root __mocks__; provide the other two.
jest.mock("next-auth/providers/microsoft-entra-id", () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: "microsoft-entra-id" })),
}));
jest.mock("next-auth/providers/ping-id", () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: "ping-id" })),
}));

type LibModule = typeof import("./lib");
// Required (not imported) so it evaluates after AUTH_CLIENT_ID is set above.
 
const {
  AuthContext,
  KeycloakAuthStrategy,
  MicrosoftEntraAuthStrategy,
  PingFederateAuthStrategy,
} = require("./lib") as LibModule;

/**
 * Builds an unsigned JWT string that jose's decodeJwt can decode.
 * @param payload
 */
function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "none", typ: "JWT" })}.${b64(payload)}.`;
}

const baseProfile = {
  sub: "user-sub-123",
  preferred_username: "jdoe",
  email: "jdoe@example.com",
  given_name: "John",
  family_name: "Doe",
} as unknown as Profile;

beforeEach(() => {
  jest.clearAllMocks();
  mockIsAuthDisabledServerCheck.mockReturnValue(false);
});

describe("KeycloakAuthStrategy", () => {
  const strategy = new KeycloakAuthStrategy();

  it("maps the first Keycloak role to its UserRole enum", () => {
    const account = {
      access_token: makeJwt({
        resource_access: { "qc-client": { roles: ["admin"] } },
      }),
    } as unknown as Account;

    const result = strategy.parseIdpResponseForUserToken(
      {} as JWT,
      account,
      baseProfile,
    );

    expect(result).toEqual({
      id: "user-sub-123",
      username: "jdoe",
      email: "jdoe@example.com",
      firstName: "John",
      lastName: "Doe",
      qcRole: UserRole.ADMIN,
    });
  });

  it("maps super-admin role", () => {
    const account = {
      access_token: makeJwt({
        resource_access: { "qc-client": { roles: ["super-admin"] } },
      }),
    } as unknown as Account;

    const result = strategy.parseIdpResponseForUserToken(
      {} as JWT,
      account,
      baseProfile,
    );
    expect(result.qcRole).toBe(UserRole.SUPER_ADMIN);
  });

  it("falls back to STANDARD when the role is unrecognized", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const account = {
      access_token: makeJwt({
        resource_access: { "qc-client": { roles: ["nonsense"] } },
      }),
    } as unknown as Account;

    const result = strategy.parseIdpResponseForUserToken(
      {} as JWT,
      account,
      baseProfile,
    );
    expect(result.qcRole).toBe(UserRole.STANDARD);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("falls back to STANDARD and empty fields when no access token is present", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const result = strategy.parseIdpResponseForUserToken(
      {} as JWT,
      {} as Account,
      {} as Profile,
    );

    expect(result).toEqual({
      id: "",
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      qcRole: UserRole.STANDARD,
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("sets up the provider from AUTH_ISSUER when named/local URLs are unset", () => {
    const prev = { ...process.env };
    delete process.env.NAMED_KEYCLOAK;
    delete process.env.LOCAL_KEYCLOAK;
    process.env.AUTH_ISSUER = "https://issuer.example";

    strategy.setUpNextAuthProvider();

    expect(KeycloakProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        jwks_endpoint: "https://issuer.example/protocol/openid-connect/certs",
        issuer: "https://issuer.example",
      }),
    );
    process.env = prev;
  });

  it("sets up the provider using explicit named/local URLs", () => {
    const prev = { ...process.env };
    process.env.NAMED_KEYCLOAK = "http://named:8080/realms/qc";
    process.env.LOCAL_KEYCLOAK = "http://local:8080/realms/qc";

    strategy.setUpNextAuthProvider();

    expect(KeycloakProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        token: "http://named:8080/realms/qc/protocol/openid-connect/token",
        issuer: "http://local:8080/realms/qc",
      }),
    );
    process.env = prev;
  });
});

describe("MicrosoftEntraAuthStrategy", () => {
  const strategy = new MicrosoftEntraAuthStrategy();

  it("derives first/last name by splitting the id_token name claim", () => {
    const profile = {
      oid: "entra-oid-1",
      preferred_username: "jane@corp.com",
      roles: ["admin"],
    } as unknown as Profile;
    const account = {
      id_token: makeJwt({ name: "Jane Q Public" }),
    } as unknown as Account;

    const result = strategy.parseIdpResponseForUserToken(
      {} as JWT,
      account,
      profile,
    );

    expect(result).toEqual({
      id: "entra-oid-1",
      username: "jane@corp.com",
      firstName: "Jane",
      lastName: "Q Public",
      qcRole: UserRole.ADMIN,
    });
  });

  it("prefers explicit token given_name/last_name over the name claim", () => {
    const profile = {
      oid: "entra-oid-2",
      preferred_username: "bob@corp.com",
      roles: ["standard"],
    } as unknown as Profile;
    const account = {
      id_token: makeJwt({ name: "Ignored Name" }),
    } as unknown as Account;
    const token = {
      given_name: "Bobby",
      last_name: "Tables",
    } as unknown as JWT;

    const result = strategy.parseIdpResponseForUserToken(
      token,
      account,
      profile,
    );

    expect(result.firstName).toBe("Bobby");
    expect(result.lastName).toBe("Tables");
    expect(result.qcRole).toBe(UserRole.STANDARD);
  });

  it("sets up the Microsoft Entra provider", () => {
    const provider = strategy.setUpNextAuthProvider();
    expect(MicrosoftEntraID).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: process.env.AUTH_CLIENT_ID,
        authorization: expect.any(Object),
      }),
    );
    expect(provider).toEqual({ id: "microsoft-entra-id" });
  });
});

describe("PingFederateAuthStrategy", () => {
  const strategy = new PingFederateAuthStrategy();

  it("reads roles from the access token's default 'roles' claim", () => {
    const account = {
      access_token: makeJwt({ roles: ["admin"] }),
    } as unknown as Account;

    const result = strategy.parseIdpResponseForUserToken(
      {} as JWT,
      account,
      baseProfile,
    );

    expect(result).toEqual({
      id: "user-sub-123",
      username: "jdoe",
      email: "jdoe@example.com",
      firstName: "John",
      lastName: "Doe",
      qcRole: UserRole.ADMIN,
    });
  });

  it("honors a custom PING_ROLE_CLAIM env var", () => {
    const prev = process.env.PING_ROLE_CLAIM;
    process.env.PING_ROLE_CLAIM = "custom_roles";
    const account = {
      access_token: makeJwt({ custom_roles: ["super-admin"] }),
    } as unknown as Account;

    const result = strategy.parseIdpResponseForUserToken(
      {} as JWT,
      account,
      baseProfile,
    );
    expect(result.qcRole).toBe(UserRole.SUPER_ADMIN);
    process.env.PING_ROLE_CLAIM = prev;
  });

  it("falls back to profile roles when the token cannot be decoded", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const account = { access_token: "not-a-jwt" } as unknown as Account;
    const profile = { ...baseProfile, roles: ["admin"] } as unknown as Profile;

    const result = strategy.parseIdpResponseForUserToken(
      {} as JWT,
      account,
      profile,
    );
    expect(result.qcRole).toBe(UserRole.ADMIN);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("falls back to STANDARD when no access token is present", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = strategy.parseIdpResponseForUserToken(
      {} as JWT,
      {} as Account,
      {} as Profile,
    );
    expect(result.qcRole).toBe(UserRole.STANDARD);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("warns and falls back to STANDARD for an unrecognized role", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const account = {
      access_token: makeJwt({ roles: ["not-a-real-role"] }),
    } as unknown as Account;

    const result = strategy.parseIdpResponseForUserToken(
      {} as JWT,
      account,
      baseProfile,
    );
    expect(result.qcRole).toBe(UserRole.STANDARD);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("No recognized role"),
    );
    warnSpy.mockRestore();
  });

  it("sets up the Ping provider", () => {
    const provider = strategy.setUpNextAuthProvider();
    expect(PingId).toHaveBeenCalledWith(
      expect.objectContaining({ issuer: process.env.AUTH_ISSUER }),
    );
    expect(provider).toEqual({ id: "ping-id" });
  });
});

describe("AuthContext", () => {
  it("delegates parseIdpResponseForUserToken to the configured strategy", () => {
    const fakeToken = { id: "x" } as unknown;
    const strategy = {
      parseIdpResponseForUserToken: jest.fn().mockReturnValue(fakeToken),
      setUpNextAuthProvider: jest.fn(),
    };
    const context = new AuthContext(strategy);

    const account = {} as Account;
    const profile = {} as Profile;
    const result = context.parseIdpResponseForUserToken(
      {} as JWT,
      account,
      profile,
    );

    expect(result).toBe(fakeToken);
    expect(strategy.parseIdpResponseForUserToken).toHaveBeenCalledWith(
      {},
      account,
      profile,
    );
  });

  it("switches strategy with setStrategy", () => {
    const first = {
      parseIdpResponseForUserToken: jest.fn().mockReturnValue("first"),
      setUpNextAuthProvider: jest.fn(),
    };
    const second = {
      parseIdpResponseForUserToken: jest.fn().mockReturnValue("second"),
      setUpNextAuthProvider: jest.fn(),
    };
    const context = new AuthContext(first);
    context.setStrategy(second);

    const result = context.parseIdpResponseForUserToken(
      {} as JWT,
      {} as Account,
      {} as Profile,
    );
    expect(result).toBe("second");
    expect(first.parseIdpResponseForUserToken).not.toHaveBeenCalled();
  });

  describe("extendTokenWithExpirationTime", () => {
    const context = new AuthContext(new KeycloakAuthStrategy());

    it("computes expiresIn from a future exp", () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const result = context.extendTokenWithExpirationTime({ exp } as JWT);
      expect(result).not.toBeNull();
      expect(result?.expiresIn).toBeGreaterThan(0);
      expect(result?.expiresIn).toBeLessThanOrEqual(3600);
    });

    it("returns null for an expired token", () => {
      const exp = Math.floor(Date.now() / 1000) - 10;
      const result = context.extendTokenWithExpirationTime({ exp } as JWT);
      expect(result).toBeNull();
    });

    it("returns the token unchanged when there is no exp or expiresIn", () => {
      const token = { foo: "bar" } as unknown as JWT;
      const result = context.extendTokenWithExpirationTime(token);
      expect(result).toBe(token);
    });
  });

  describe("extendTokenWithUserInfo", () => {
    const context = new AuthContext(new KeycloakAuthStrategy());
    const userToken = {
      id: "u1",
      username: "u1",
      firstName: "U",
      lastName: "One",
      qcRole: UserRole.ADMIN,
    };

    it("forces SUPER_ADMIN role when auth is disabled", () => {
      mockIsAuthDisabledServerCheck.mockReturnValue(true);
      const result = context.extendTokenWithUserInfo({} as JWT, userToken);
      expect(result.role).toBe(UserRole.SUPER_ADMIN);
      expect(result.qcRole).toBe(UserRole.ADMIN);
      expect(result.username).toBe("u1");
    });

    it("sets role from userToken.qcRole when the token already has a role", () => {
      const token = { role: UserRole.STANDARD } as unknown as JWT;
      const result = context.extendTokenWithUserInfo(token, userToken);
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it("merges userToken without a role when none is set and auth is enabled", () => {
      const result = context.extendTokenWithUserInfo({} as JWT, userToken);
      expect(result.role).toBeUndefined();
      expect(result.id).toBe("u1");
      expect(result.qcRole).toBe(UserRole.ADMIN);
    });
  });
});
