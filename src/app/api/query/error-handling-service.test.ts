import {
  handleRequestError,
  handleAndReturnError,
} from "./error-handling-service";

describe("handleRequestError", () => {
  it("wraps the diagnostics message in an error OperationOutcome", async () => {
    const outcome = await handleRequestError("something broke");
    expect(outcome).toEqual({
      resourceType: "OperationOutcome",
      issue: [
        { severity: "error", code: "invalid", diagnostics: "something broke" },
      ],
    });
  });
});

describe("handleAndReturnError", () => {
  // Keep the console clean; the function logs the error by design.
  let errorSpy: jest.SpyInstance;
  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => errorSpy.mockRestore());

  it("returns a 500 NextResponse by default", async () => {
    const res = await handleAndReturnError("boom");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.issue[0].diagnostics).toBe("boom");
  });

  it("uses the provided status code", async () => {
    const res = await handleAndReturnError("bad request", 400);
    expect(res.status).toBe(400);
  });

  it("includes the message when passed an Error instance", async () => {
    const res = await handleAndReturnError(new Error("kaboom"));
    const body = await res.json();
    expect(body.issue[0].diagnostics).toContain("kaboom");
  });

  it("falls back to the generic message for a non-string, non-Error value", async () => {
    const res = await handleAndReturnError({ unexpected: true });
    const body = await res.json();
    expect(body.issue[0].diagnostics).toBe("An error has occurred");
  });
});
