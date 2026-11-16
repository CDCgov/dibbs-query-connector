import { MISSING_API_KEY_LITERAL, INVALID_API_KEY_LITERAL } from "@/constants";
import { fetchConditionWithRetry } from "./service";
import { getVSACValueset } from "./api-calls";
import { suppressConsoleLogs } from "@/app/tests/integration/fixtures";

jest.mock("./api-calls", () => ({
  getVSACValueset: jest.fn(),
}));

const mockGetVSACValueSet = getVSACValueset as unknown as jest.Mock;

describe("fetchConditionWithRetry", () => {
  const CONDITION = "code1*system1*Condition One";
  const PARAMS_RESPONSE = {
    data: {
      resourceType: "Parameters",
      parameter: [{ name: "version", valueString: "http://vsac/version/2024" }],
    },
    success: true,
  };
  const OPERATION_OUTCOME = {
    data: {
      resourceType: "OperationOutcome",
      issue: [
        { severity: "error", code: "processing", diagnostics: "503: down" },
      ],
    },
    success: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    suppressConsoleLogs();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the struct without retrying when the first lookup succeeds", async () => {
    mockGetVSACValueSet.mockResolvedValueOnce(PARAMS_RESPONSE);

    const result = await fetchConditionWithRetry(CONDITION);

    expect(result).toEqual({
      id: "code1",
      system: "system1",
      name: "Condition One",
      version: "2024",
      category: "",
    });
    expect(mockGetVSACValueSet).toHaveBeenCalledTimes(1);
  });

  it("retries a transient transport failure and then succeeds", async () => {
    mockGetVSACValueSet
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce(PARAMS_RESPONSE);

    const promise = fetchConditionWithRetry(CONDITION);
    await jest.runAllTimersAsync();

    expect((await promise).version).toBe("2024");
    expect(mockGetVSACValueSet).toHaveBeenCalledTimes(2);
  });

  it("retries a non-200 OperationOutcome and then succeeds", async () => {
    mockGetVSACValueSet
      .mockResolvedValueOnce(OPERATION_OUTCOME)
      .mockResolvedValueOnce(PARAMS_RESPONSE);

    const promise = fetchConditionWithRetry(CONDITION);
    await jest.runAllTimersAsync();

    expect((await promise).version).toBe("2024");
    expect(mockGetVSACValueSet).toHaveBeenCalledTimes(2);
  });

  it("falls back to an empty version when VSAC keeps returning an OperationOutcome", async () => {
    mockGetVSACValueSet.mockResolvedValue(OPERATION_OUTCOME);

    const promise = fetchConditionWithRetry(CONDITION);
    await jest.runAllTimersAsync();

    // 1 initial attempt + VSAC_MAX_FETCH_RETRIES (3) retries, then tolerate.
    expect((await promise).version).toBe("");
    expect(mockGetVSACValueSet).toHaveBeenCalledTimes(4);
  });

  it("throws immediately on a missing API key without retrying", async () => {
    mockGetVSACValueSet.mockRejectedValue(
      new Error("UMLS API Key not set", { cause: MISSING_API_KEY_LITERAL }),
    );

    await expect(fetchConditionWithRetry(CONDITION)).rejects.toThrow(
      "UMLS API Key not set",
    );
    expect(mockGetVSACValueSet).toHaveBeenCalledTimes(1);
  });

  it("throws immediately without retrying when VSAC rejects the API key", async () => {
    mockGetVSACValueSet.mockResolvedValue({
      data: {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "security",
            diagnostics: "401: Unauthorized",
          },
        ],
      },
      success: false,
    });

    await expect(fetchConditionWithRetry(CONDITION)).rejects.toMatchObject({
      message: expect.stringContaining("VSAC rejected the UMLS API key"),
      cause: INVALID_API_KEY_LITERAL,
    });
    expect(mockGetVSACValueSet).toHaveBeenCalledTimes(1);
  });

  it("throws after exhausting retries on a persistent transport failure", async () => {
    mockGetVSACValueSet.mockRejectedValue(new Error("fetch failed"));

    const promise = fetchConditionWithRetry(CONDITION);
    const assertion = expect(promise).rejects.toThrow(
      /failed after 4 attempts/,
    );
    await jest.runAllTimersAsync();
    await assertion;

    expect(mockGetVSACValueSet).toHaveBeenCalledTimes(4);
  });
});
