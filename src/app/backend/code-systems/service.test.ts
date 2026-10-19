import { getVSACValueSet } from "@/seed/fetch/api-calls";
import { OperationOutcome } from "fhir/r4";

jest.mock("@/auth", () => ({
  superAdminAccessCheck: jest.fn().mockResolvedValue(true),
  adminAccessCheck: jest.fn().mockResolvedValue(true),
  authenticatedAccessCheck: jest.fn().mockResolvedValue(true),
}));

describe("getVSACValueSet", () => {
  const originalKey = process.env.UMLS_API_KEY;
  const fetchSpy = jest.spyOn(global, "fetch");

  beforeEach(() => {
    process.env.UMLS_API_KEY = "test-key";
    fetchSpy.mockReset();
  });

  afterAll(() => {
    process.env.UMLS_API_KEY = originalKey;
    fetchSpy.mockRestore();
  });

  it("uses the diagnostics from a JSON OperationOutcome body", async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({
          resourceType: "OperationOutcome",
          issue: [{ diagnostics: "Value set not found" }],
        }),
        { status: 404 },
      ),
    );

    const result = (await getVSACValueSet("1.2.3")) as OperationOutcome;

    expect(result.issue[0].code).toBe("processing");
    expect(result.issue[0].diagnostics).toBe("404: Value set not found");
  });

  it("keeps a non-JSON error body as the diagnostics", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify("Service Unavailable"), { status: 503 }),
    );

    const result = (await getVSACValueSet("1.2.3")) as OperationOutcome;

    expect(result.issue[0].code).toBe("processing");
    expect(result.issue[0].diagnostics).toInclude("Service Unavailable");
  });
});
