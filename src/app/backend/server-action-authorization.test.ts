/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";
import { auth } from "@/auth";
import { getUserRole } from "@/app/backend/auth/user-provisioning";
import dbService from "@/app/backend/db/service";
import { UserRole } from "@/app/models/entities/users";

// Every export of a "use server" module is reachable as a direct POST, so
// each one must check access itself. This test calls every exported action
// as a signed-out caller and as a standard user and expects a denial before
// any database work happens, except for the actions listed below.

jest.mock("@/auth", () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("@/app/backend/auth/user-provisioning", () => ({
  getUserRole: jest.fn(),
  addUserIfNotExists: jest.fn(),
  updateUserDetails: jest.fn(),
}));

jest.mock("@/app/backend/db/service", () => ({
  __esModule: true,
  default: { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }) },
}));

// Actions any caller may invoke, including before sign-in.
const PUBLIC_ACTIONS: Record<string, string[]> = {
  "backend/session-management.ts": ["signIn", "signOut"],
};

// Actions open to standard users. Everything else requires an admin role.
const STANDARD_USER_ACTIONS: Record<string, string[]> = {
  "backend/fhir-servers/service.ts": [
    "getFhirServerNames",
    "getFhirServerSummaries",
  ],
  "backend/query-building/service.ts": ["getSavedQuerySummaries"],
  "backend/query-execution/actions.ts": [
    "patientRecordsQuery",
    "patientDiscoveryQuery",
  ],
  "backend/user-management.ts": ["getAllAdmins"],
};

// Scan the whole app so a "use server" module added outside backend/ (for
// example a page or component file) is covered too.
const APP_DIR = path.join(__dirname, "..");
const SKIPPED_DIRS = new Set(["tests"]);
const DENIAL_MESSAGE = /(permission|Authentication) check for \w+ failed/;

function findServerActionModules(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return SKIPPED_DIRS.has(entry.name)
        ? []
        : findServerActionModules(fullPath);
    }
    if (!/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) {
      return [];
    }
    const source = fs.readFileSync(fullPath, "utf-8");
    return /^["']use server["']/.test(source.trimStart()) ? [fullPath] : [];
  });
}

const actionModules = findServerActionModules(APP_DIR).map((fullPath) => {
  const relativePath = path.relative(APP_DIR, fullPath);
  const exports = require(fullPath) as Record<string, unknown>;
  const actions = Object.entries(exports)
    .filter(([, value]) => typeof value === "function")
    .map(([name, fn]) => ({ name, fn: fn as () => Promise<unknown> }));
  return { relativePath, actions };
});

async function expectDenied(call: () => Promise<unknown>) {
  let outcome: unknown;
  try {
    outcome = await call();
  } catch (error) {
    outcome = error;
  }
  const message =
    outcome instanceof Error
      ? outcome.message
      : (outcome as { error?: string } | undefined)?.error;
  expect(message).toMatch(DENIAL_MESSAGE);
  expect(dbService.query).not.toHaveBeenCalled();
}

function casesExcept(allowed: Record<string, string[]>) {
  return actionModules.flatMap(({ relativePath, actions }) =>
    actions
      .filter(({ name }) => !(allowed[relativePath] ?? []).includes(name))
      .map(({ name, fn }) => [`${relativePath} ${name}`, fn] as const),
  );
}

describe("server action authorization", () => {
  const originalAuthDisabled = process.env.AUTH_DISABLED;

  beforeAll(() => {
    process.env.AUTH_DISABLED = "false";
  });

  afterAll(() => {
    process.env.AUTH_DISABLED = originalAuthDisabled;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("finds the server action modules", () => {
    expect(actionModules.length).toBeGreaterThan(5);
    const allowlisted = { ...PUBLIC_ACTIONS, ...STANDARD_USER_ACTIONS };
    for (const [relativePath, names] of Object.entries(allowlisted)) {
      const actionModule = actionModules.find(
        (m) => m.relativePath === relativePath,
      );
      const exported = actionModule?.actions.map((a) => a.name) ?? [];
      expect(exported).toEqual(expect.arrayContaining(names));
    }
  });

  describe("without a session", () => {
    beforeEach(() => {
      (auth as jest.Mock).mockResolvedValue(null);
      (getUserRole as jest.Mock).mockResolvedValue(UserRole.STANDARD);
    });

    it.each(casesExcept(PUBLIC_ACTIONS))("denies %s", async (_, fn) => {
      await expectDenied(fn);
    });
  });

  describe("as a standard user", () => {
    beforeEach(() => {
      (auth as jest.Mock).mockResolvedValue({
        user: { username: "standard-user" },
      });
      (getUserRole as jest.Mock).mockResolvedValue(UserRole.STANDARD);
    });

    const allowed = Object.fromEntries(
      Object.keys({ ...PUBLIC_ACTIONS, ...STANDARD_USER_ACTIONS }).map(
        (key) => [
          key,
          [
            ...(PUBLIC_ACTIONS[key] ?? []),
            ...(STANDARD_USER_ACTIONS[key] ?? []),
          ],
        ],
      ),
    );

    it.each(casesExcept(allowed))("denies %s", async (_, fn) => {
      await expectDenied(fn);
    });
  });
});
