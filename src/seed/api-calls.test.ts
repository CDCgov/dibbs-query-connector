import { OperationOutcome } from "fhir/r4";
import { getVsacValueSet } from "./api-calls";

jest.mock("@/app/backend/db/decorators/auth");

describe("getVsacValueSet", () => {
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

  it("throws on a 401 with an empty body", async () => {
    // VSAC answers over HTTP/2, so there's no status text either.
    fetchSpy.mockResolvedValue(new Response(null, { status: 401 }));

    await expect(getVsacValueSet("1.2.3")).rejects.toThrow(
      "VSAC rejected the UMLS API key",
    );
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

    const result = (await getVsacValueSet("1.2.3")).data as OperationOutcome;

    expect(result.issue[0].code).toBe("processing");
    expect(result.issue[0].diagnostics).toBe("404: Value set not found");
  });

  it("keeps a non-JSON error body as the diagnostics", async () => {
    fetchSpy.mockResolvedValue(
      new Response("Service Unavailable", { status: 503 }),
    );

    const result = (await getVsacValueSet("1.2.3")).data as OperationOutcome;

    expect(result.issue[0].code).toBe("processing");
    expect(result.issue[0].diagnostics).toBe("503: Service Unavailable");
  });
});
