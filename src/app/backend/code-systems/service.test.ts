import { OperationOutcome } from "fhir/r4";
import { getVSACValueSet } from "./service";

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

  it("marks a 401 with an empty body as a security issue", async () => {
    // VSAC answers over HTTP/2, so there's no status text either.
    fetchSpy.mockResolvedValue(new Response(null, { status: 401 }));

    const result = (await getVSACValueSet("1.2.3")) as OperationOutcome;

    expect(result.resourceType).toBe("OperationOutcome");
    expect(result.issue[0].code).toBe("security");
    expect(result.issue[0].diagnostics).toBe("401");
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
      new Response("Service Unavailable", { status: 503 }),
    );

    const result = (await getVSACValueSet("1.2.3")) as OperationOutcome;

    expect(result.issue[0].code).toBe("processing");
    expect(result.issue[0].diagnostics).toBe("503: Service Unavailable");
  });
});
