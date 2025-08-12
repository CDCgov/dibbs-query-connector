import fs from "fs";
import path from "path";
import {
  getOrCreateMtlsCert,
  getOrCreateMtlsKey,
  isMtlsAvailable,
} from "@/app/shared/mtls-utils";
import { suppressConsoleLogs } from "../integration/fixtures";

// Mock fs module
jest.mock("fs");

describe("Mutual TLS Utilities", () => {
  const mockCert =
    "-----BEGIN CERTIFICATE-----\nMOCK_CERT_CONTENT\n-----END CERTIFICATE-----";
  const mockKey =
    "-----BEGIN PRIVATE KEY-----\nMOCK_KEY_CONTENT\n-----END PRIVATE KEY-----";
  const keysDir = path.join(process.cwd(), "keys");
  const certPath = path.join(keysDir, "mtls-cert.pem");
  const keyPath = path.join(keysDir, "mtls-key.pem");

  beforeEach(() => {
    suppressConsoleLogs();
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.MTLS_CERT;
    delete process.env.MTLS_KEY;
  });

  describe("getOrCreateMtlsCert", () => {
    it("should return existing certificate from file", () => {
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        if (path === keysDir) return true;
        if (path === certPath) return true;
        return false;
      });
      (fs.readFileSync as jest.Mock).mockReturnValue(mockCert);

      const result = getOrCreateMtlsCert();

      expect(result).toBe(mockCert);
      expect(fs.readFileSync).toHaveBeenCalledWith(certPath, "utf-8");
    });

    it("should create certificate from environment variable when file doesn't exist", () => {
      process.env.MTLS_CERT = mockCert;
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        if (path === keysDir) return true;
        if (path === certPath) return false;
        return false;
      });
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      const result = getOrCreateMtlsCert();
      const decodedCert = Buffer.from(mockCert, "base64").toString("utf-8");

      expect(result).toBe(mockCert);
      expect(fs.writeFileSync).toHaveBeenCalledWith(certPath, decodedCert, {
        mode: 0o600,
      });
    });

    it("should create keys directory if it doesn't exist", () => {
      process.env.MTLS_CERT = mockCert;
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      const result = getOrCreateMtlsCert();

      expect(fs.mkdirSync).toHaveBeenCalledWith(keysDir, { recursive: true });
      expect(result).toBe(mockCert);
    });

    it("should throw error when certificate not found and env var not set", () => {
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        if (path === keysDir) return true;
        if (path === certPath) return false;
        return false;
      });

      expect(() => getOrCreateMtlsCert()).toThrow(
        "Mutual TLS certificate not found in keys directory and MTLS_CERT environment variable is not set",
      );
    });
  });

  describe("getOrCreateMtlsKey", () => {
    it("should return existing key from file", () => {
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        if (path === keysDir) return true;
        if (path === keyPath) return true;
        return false;
      });
      (fs.readFileSync as jest.Mock).mockReturnValue(mockKey);

      const result = getOrCreateMtlsKey();

      expect(result).toBe(mockKey);
      expect(fs.readFileSync).toHaveBeenCalledWith(keyPath, "utf-8");
    });

    it("should create key from environment variable when file doesn't exist", () => {
      process.env.MTLS_KEY = mockKey;
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        if (path === keysDir) return true;
        if (path === keyPath) return false;
        return false;
      });
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      const result = getOrCreateMtlsKey();
      const decodedKey = Buffer.from(mockKey, "base64").toString("utf-8");

      expect(result).toBe(mockKey);
      expect(fs.writeFileSync).toHaveBeenCalledWith(keyPath, decodedKey, {
        mode: 0o600,
      });
    });

    it("should throw error when key not found and env var not set", () => {
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        if (path === keysDir) return true;
        if (path === keyPath) return false;
        return false;
      });

      expect(() => getOrCreateMtlsKey()).toThrow(
        "Mutual TLS key not found in keys directory and MTLS_KEY environment variable is not set",
      );
    });
  });

  describe("isMtlsAvailable", () => {
    it("should return true when both cert and key files exist", () => {
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        if (path === keysDir) return true;
        if (path === certPath) return true;
        if (path === keyPath) return true;
        return false;
      });

      expect(isMtlsAvailable()).toBe(true);
    });

    it("should return true when both environment variables are set", () => {
      process.env.MTLS_CERT = mockCert;
      process.env.MTLS_KEY = mockKey;
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(isMtlsAvailable()).toBe(true);
    });

    it("should return false when cert file exists but key doesn't and no env vars", () => {
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        if (path === keysDir) return true;
        if (path === certPath) return true;
        if (path === keyPath) return false;
        return false;
      });

      expect(isMtlsAvailable()).toBe(false);
    });

    it("should return false when no files exist and no env vars set", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(isMtlsAvailable()).toBe(false);
    });
  });
});
