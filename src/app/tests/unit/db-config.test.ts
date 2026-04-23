import {
  fetchDbPassword,
  buildSslConfig,
  parseDbUrl,
  isDbAuthError,
  rotateDbCredentialsOnAuthFailure,
} from "@/app/backend/db/config";

import fs from "fs";

const mockSend = jest.fn();

jest.mock("@aws-sdk/client-secrets-manager", () => ({
  SecretsManagerClient: jest.fn(() => ({ send: mockSend })),
  GetSecretValueCommand: jest.fn((input: unknown) => input),
}));

beforeEach(() => {
  mockSend.mockReset();
  delete process.env._DB_PASSWORD;
  delete process.env._DB_PASSWORD_TS;
  delete (globalThis as Record<string, unknown>)._secretsManagerClient;
});

afterEach(() => {
  delete process.env.DB_SECRET_ARN;
  delete process.env.DB_SSL_CA_PATH;
  delete process.env.DATABASE_URL;
  delete process.env._DB_PASSWORD;
  delete process.env._DB_PASSWORD_TS;
  delete (globalThis as Record<string, unknown>)._secretsManagerClient;
});

describe("fetchDbPassword", () => {
  beforeEach(() => {
    process.env.DB_SECRET_ARN = "arn:aws:secretsmanager:us-east-1:123:secret:x";
  });

  it("fetches and returns the password from Secrets Manager", async () => {
    mockSend.mockResolvedValue({
      SecretString: JSON.stringify({ password: "my-secret-pw" }),
    });

    const pw = await fetchDbPassword();
    expect(pw).toBe("my-secret-pw");
    expect(process.env._DB_PASSWORD).toBe("my-secret-pw");
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("caches the password within the TTL", async () => {
    mockSend.mockResolvedValue({
      SecretString: JSON.stringify({ password: "cached-pw" }),
    });

    const pw1 = await fetchDbPassword();
    const pw2 = await fetchDbPassword();

    expect(pw1).toBe("cached-pw");
    expect(pw2).toBe("cached-pw");
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("re-fetches after the cache TTL expires", async () => {
    jest.useFakeTimers();
    mockSend
      .mockResolvedValueOnce({
        SecretString: JSON.stringify({ password: "old-pw" }),
      })
      .mockResolvedValueOnce({
        SecretString: JSON.stringify({ password: "new-pw" }),
      });

    const pw1 = await fetchDbPassword();
    expect(pw1).toBe("old-pw");

    // Advance past the 5-minute TTL
    jest.advanceTimersByTime(5 * 60 * 1000 + 1);

    const pw2 = await fetchDbPassword();
    expect(pw2).toBe("new-pw");
    expect(mockSend).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it("throws when SecretString is empty", async () => {
    mockSend.mockResolvedValue({ SecretString: "" });

    await expect(fetchDbPassword()).rejects.toThrow(
      "AWS Secrets Manager returned empty SecretString",
    );
  });

  it("throws when password field is missing from secret JSON", async () => {
    mockSend.mockResolvedValue({
      SecretString: JSON.stringify({ username: "admin" }),
    });

    await expect(fetchDbPassword()).rejects.toThrow(
      "Secret JSON does not contain a valid 'password' string field",
    );
  });

  it("throws when password field is not a string", async () => {
    mockSend.mockResolvedValue({
      SecretString: JSON.stringify({ password: 12345 }),
    });

    await expect(fetchDbPassword()).rejects.toThrow(
      "Secret JSON does not contain a valid 'password' string field",
    );
  });
});

describe("buildSslConfig", () => {
  it("returns undefined when DB_SSL_CA_PATH is not set", () => {
    delete process.env.DB_SSL_CA_PATH;
    expect(buildSslConfig()).toBeUndefined();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns ssl config with CA cert when DB_SSL_CA_PATH is set", () => {
    const fakeCert =
      "-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----";
    jest.spyOn(fs, "readFileSync").mockReturnValue(fakeCert);

    process.env.DB_SSL_CA_PATH = "/app/certs/rds-global-bundle.pem";
    const result = buildSslConfig();

    expect(result).toEqual({
      rejectUnauthorized: true,
      ca: fakeCert,
    });
    expect(fs.readFileSync).toHaveBeenCalledWith(
      "/app/certs/rds-global-bundle.pem",
      "utf8",
    );
  });

  it("throws when DB_SSL_CA_PATH points to a nonexistent file", () => {
    process.env.DB_SSL_CA_PATH = "/nonexistent/path.pem";
    expect(() => buildSslConfig()).toThrow(
      'Failed to read SSL CA certificate from DB_SSL_CA_PATH="/nonexistent/path.pem"',
    );
  });
});

describe("parseDbUrl", () => {
  it("tolerates special chars in the password when DB_SECRET_ARN is set", () => {
    process.env.DB_SECRET_ARN = "arn:aws:secretsmanager:us-east-1:123:secret:x";
    process.env.DATABASE_URL =
      "postgresql://nbsdbadmin:pw#with:special>chars@dbhost.com:5432/dbname";

    const parsed = parseDbUrl();

    expect(parsed.host).toBe("dbhost.com");
    expect(parsed.port).toBe(5432);
    expect(parsed.user).toBe("nbsdbadmin");
    expect(parsed.database).toBe("dbname");
    expect(parsed.password).toBeUndefined();
  });

  it("preserves query parameters when stripping the password", () => {
    process.env.DB_SECRET_ARN = "arn:aws:secretsmanager:us-east-1:123:secret:x";
    process.env.DATABASE_URL =
      "postgresql://admin:p@ss#w0rd@dbhost.com:5432/db?sslmode=require";

    const parsed = parseDbUrl();

    expect(parsed.host).toBe("dbhost.com");
    expect(parsed.user).toBe("admin");
    expect(parsed.database).toBe("db");
  });

  it("throws a helpful error when the password has special chars and DB_SECRET_ARN is NOT set", () => {
    delete process.env.DB_SECRET_ARN;
    process.env.DATABASE_URL =
      "postgresql://nbsdbadmin:pw#with>chars@dbhost.com:5432/dbname";

    expect(() => parseDbUrl()).toThrow(/percent-encode/);
    expect(() => parseDbUrl()).toThrow(/DB_SECRET_ARN/);
  });

  it("parses a normal DATABASE_URL without DB_SECRET_ARN", () => {
    delete process.env.DB_SECRET_ARN;
    process.env.DATABASE_URL =
      "postgresql://postgres:pw@localhost:5432/tefca_db";

    const parsed = parseDbUrl();

    expect(parsed.host).toBe("localhost");
    expect(parsed.port).toBe(5432);
    expect(parsed.user).toBe("postgres");
    expect(parsed.database).toBe("tefca_db");
    expect(parsed.password).toBe("pw");
  });
});

describe("isDbAuthError", () => {
  it("returns true for pg invalid_password (28P01)", () => {
    expect(isDbAuthError({ code: "28P01" })).toBe(true);
  });

  it("returns true for pg invalid_authorization_specification (28000)", () => {
    expect(isDbAuthError({ code: "28000" })).toBe(true);
  });

  it("returns false for other pg error codes", () => {
    expect(isDbAuthError({ code: "23505" })).toBe(false);
  });

  it("returns false for non-object values", () => {
    expect(isDbAuthError(null)).toBe(false);
    expect(isDbAuthError(undefined)).toBe(false);
    expect(isDbAuthError("28P01")).toBe(false);
  });

  it("returns false when code is not a string", () => {
    expect(isDbAuthError({ code: 28001 })).toBe(false);
  });
});

describe("rotateDbCredentialsOnAuthFailure", () => {
  it("clears the cached password env vars", async () => {
    process.env._DB_PASSWORD = "stale-pw";
    process.env._DB_PASSWORD_TS = String(Date.now());

    await rotateDbCredentialsOnAuthFailure();

    expect(process.env._DB_PASSWORD).toBeUndefined();
    expect(process.env._DB_PASSWORD_TS).toBeUndefined();
  });

  it("returns the same in-flight promise for concurrent callers", async () => {
    process.env._DB_PASSWORD = "stale-pw";

    const [p1, p2, p3] = [
      rotateDbCredentialsOnAuthFailure(),
      rotateDbCredentialsOnAuthFailure(),
      rotateDbCredentialsOnAuthFailure(),
    ];

    expect(p1).toBe(p2);
    expect(p2).toBe(p3);
    await Promise.all([p1, p2, p3]);
    expect(process.env._DB_PASSWORD).toBeUndefined();
  });
});
