import {
  addUserIfNotExists,
  updateUserRole,
} from "@/app/backend/user-management";
import { auth } from "@/auth";
import { Bundle, BundleEntry, Patient } from "fhir/r4";
import { getDbClient } from "@/app/backend/dbClient";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/query/route";
import { readJsonFile } from "../shared_utils/readJsonFile";
import { RoleTypeValues } from "@/app/models/entities/user-management";
import { USE_CASE_DETAILS } from "@/app/shared/constants";

// Utility function to create a minimal NextRequest-like object
function createNextRequest(
  body: unknown,
  searchParams: URLSearchParams,
): NextRequest {
  return {
    json: async () => body,
    text: async () => body,
    nextUrl: { searchParams },
    method: "POST",
    headers: new Headers(),
  } as unknown as NextRequest;
}

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
};
(auth as jest.Mock).mockResolvedValue(TEST_USER);

const PatientBundle = readJsonFile("./src/app/tests/assets/BundlePatient.json");
const PatientResource: Patient | undefined = (
  (PatientBundle as Bundle).entry as BundleEntry[]
)[0]?.resource as Patient;

if (!PatientResource || PatientResource.resourceType !== "Patient") {
  throw new Error("Invalid Patient resource in the test bundle.");
}

const SYPHILIS_QUERY_ID = USE_CASE_DETAILS.syphilis.id;

describe("Audit Logging Integration Tests", () => {
  beforeAll(async () => {
    await dbClient.query("BEGIN");
  });

  afterAll(async () => {
    await dbClient.query("ROLLBACK");
  });

  test("should find user and know their role", async () => {
    const result = await addUserIfNotExists(TEST_USER);
    const createdUserId = result.id;

    const newresult = await updateUserRole(
      createdUserId,
      RoleTypeValues.SuperAdmin,
    );
    expect(newresult.items![0]).toHaveProperty(
      "qc_role",
      RoleTypeValues.SuperAdmin,
    );
  });
});

describe("Audit Log of POST Query to FHIR Server", () => {
  beforeEach(() => {
    // supress the console warns for the error endpoints
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  it("should create an audit log if query is successful", async () => {
    const request = createNextRequest(
      PatientResource,
      new URLSearchParams(
        `id=${SYPHILIS_QUERY_ID}&fhir_server=HELIOS Meld: Direct`,
      ),
    );
    const response = await POST(request);
    const body = await response.json();
    expect(body.resourceType).toBe("Bundle");
    //TO DO = once there's an actual DB write, we can check that the auditable query shows up as it should.
    //Right now, it's generating console logs in the terminal, which doesn't make sense to test.
  });
});
