import {
  fetchDbPassword,
  buildSslConfig,
  _resetCacheForTesting,
} from "@/app/backend/db/config";

import fs from "fs";

const mockSend = jest.fn();

jest.mock("@aws-sdk/client-secrets-manager", () => ({
  SecretsManagerClient: jest.fn(() => ({ send: mockSend })),
  GetSecretValueCommand: jest.fn((input: unknown) => input),
}));

beforeEach(() => {
  _resetCacheForTesting();
  mockSend.mockReset();
});

afterEach(() => {
  delete process.env.DB_SECRET_ARN;
  delete process.env.DB_SSL_CA_PATH;
});
describe("fetchDbPassword", () => {
  it("fetches and returns the password from Secrets Manager", async () => {
    process.env.DB_SECRET_ARN = "arn:aws:secretsmanager:us-east-1:123:secret:x";
    mockSend.mockResolvedValue({
      SecretString: JSON.stringify({ password: "my-secret-pw" }),
    });

    const pw = await fetchDbPassword();
    expect(pw).toBe("my-secret-pw");
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
      "Secret JSON does not contain a 'password' field",
    );
  });
});

describe("buildSslConfig", () => {
  it("returns undefined when DB_SSL_CA_PATH is not set", () => {
    delete process.env.DB_SSL_CA_PATH;
    expect(buildSslConfig()).toBeUndefined();
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

    jest.restoreAllMocks();
  });

  it("throws when DB_SSL_CA_PATH points to a nonexistent file", () => {
    process.env.DB_SSL_CA_PATH = "/nonexistent/path.pem";
    expect(() => buildSslConfig()).toThrow();
  });
});
