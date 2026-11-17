import { MISSING_API_KEY_LITERAL, INVALID_API_KEY_LITERAL } from "@/constants";
import { fetchConditionWithRetry, fetchValueSetsFromVsac } from "./service";
import { getVsacCondition, getVsacValueSet } from "./api-calls";
import { suppressConsoleLogs } from "@/app/tests/integration/fixtures";
import ExampleVsacValueSet from "../app/tests/assets/VSACValueSet.json";
import { VSAC_MAX_FETCH_RETRIES } from "./utils";

jest.mock("./api-calls", () => {
  const originalModule = jest.requireActual("./api-calls");

  return {
    __esModule: true,
    ...originalModule,
    getVsacValueSet: jest.fn(),
    getVsacCondition: jest.fn(),
  };
});

jest.mock("./utils", () => {
  const originalModule = jest.requireActual("./utils");

  return {
    __esModule: true,
    ...originalModule,
    VSAC_RETRY_BASE_DELAY_MS: 0,
  };
});

const mockGetVsacValueSet = getVsacValueSet as unknown as jest.Mock;
const mockGetVsacCondition = getVsacCondition as unknown as jest.Mock;

const EXAMPLE_VSAC_OID = "2.16.840.1.113762.1.4.1146.170";
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

describe("fetchConditionWithRetry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    suppressConsoleLogs();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the struct without retrying when the first lookup succeeds", async () => {
    mockGetVsacCondition.mockResolvedValueOnce(PARAMS_RESPONSE);

    const result = await fetchConditionWithRetry(CONDITION);

    expect(result).toEqual({
      id: "code1",
      system: "system1",
      name: "Condition One",
      version: "2024",
      category: "",
    });
    expect(mockGetVsacCondition).toHaveBeenCalledTimes(1);
  });

  it("retries a transient transport failure and then succeeds", async () => {
    mockGetVsacCondition
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce(PARAMS_RESPONSE);

    const promise = fetchConditionWithRetry(CONDITION);
    await jest.runAllTimersAsync();

    expect((await promise).version).toBe("2024");
    expect(mockGetVsacCondition).toHaveBeenCalledTimes(2);
  });

  it("retries a non-200 OperationOutcome and then succeeds", async () => {
    mockGetVsacCondition
      .mockResolvedValueOnce(OPERATION_OUTCOME)
      .mockResolvedValueOnce(PARAMS_RESPONSE);

    const promise = fetchConditionWithRetry(CONDITION);
    await jest.runAllTimersAsync();

    expect((await promise).version).toBe("2024");
    expect(mockGetVsacCondition).toHaveBeenCalledTimes(2);
  });

  it("falls back to an empty version when VSAC keeps returning an OperationOutcome", async () => {
    mockGetVsacCondition.mockResolvedValue(OPERATION_OUTCOME);

    const promise = fetchConditionWithRetry(CONDITION);
    await jest.runAllTimersAsync();

    // 1 initial attempt + VSAC_MAX_FETCH_RETRIES (3) retries, then tolerate.
    expect((await promise).version).toBe("");
    expect(mockGetVsacCondition).toHaveBeenCalledTimes(4);
  });

  it("throws immediately on a missing API key without retrying", async () => {
    mockGetVsacCondition.mockRejectedValue(
      new Error("UMLS API Key not set", { cause: MISSING_API_KEY_LITERAL }),
    );

    await expect(fetchConditionWithRetry(CONDITION)).rejects.toThrow(
      "UMLS API Key not set",
    );
    expect(mockGetVsacCondition).toHaveBeenCalledTimes(1);
  });

  it("throws immediately without retrying when VSAC rejects the API key", async () => {
    mockGetVsacCondition.mockRejectedValue(
      new Error("VSAC rejected the UMLS API key", {
        cause: INVALID_API_KEY_LITERAL,
      }),
    );

    await expect(fetchConditionWithRetry(CONDITION)).rejects.toMatchObject({
      message: expect.stringContaining("VSAC rejected the UMLS API key"),
      cause: INVALID_API_KEY_LITERAL,
    });
    expect(mockGetVsacCondition).toHaveBeenCalledTimes(1);
  });

  it("throws after exhausting retries on a persistent transport failure", async () => {
    mockGetVsacCondition.mockRejectedValue(new Error("fetch failed"));

    const promise = fetchConditionWithRetry(CONDITION);
    const assertion = expect(promise).rejects.toThrow(
      /failed after 4 attempts/,
    );
    await jest.runAllTimersAsync();
    await assertion;

    expect(mockGetVsacCondition).toHaveBeenCalledTimes(4);
  });
});

describe("fetchValueSetsFromVsac", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // suppressConsoleLogs();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockErsdPayload = {
    oids: [EXAMPLE_VSAC_OID],
    oidToErsdResourceMap: new Map().set(EXAMPLE_VSAC_OID, "dxtc"),
    conditions: [
      {
        code: "",
        system: "",
        text: "",
        valueset_id: "",
      },
    ],
  };

  const successResponse = {
    data: ExampleVsacValueSet,
    success: true,
  };

  const expectedResult = [{ oid: EXAMPLE_VSAC_OID, vs: ExampleVsacValueSet }];

  it("returns the struct without retrying when the first lookup succeeds", async () => {
    mockGetVsacValueSet.mockResolvedValueOnce(successResponse);

    const result = await fetchValueSetsFromVsac(
      mockErsdPayload,
      10,
      VSAC_MAX_FETCH_RETRIES,
    );

    expect(result).toEqual(expectedResult);
    expect(mockGetVsacValueSet).toHaveBeenCalledTimes(1);
  });

  it("retries a transient transport failure and then succeeds", async () => {
    mockGetVsacValueSet
      .mockRejectedValueOnce(new Error("mock network blip"))
      .mockResolvedValueOnce(successResponse);

    const promise = fetchValueSetsFromVsac(
      mockErsdPayload,
      10,
      VSAC_MAX_FETCH_RETRIES,
    );
    await jest.runAllTimersAsync();

    expect(await promise).toStrictEqual(expectedResult);
    expect(mockGetVsacValueSet).toHaveBeenCalledTimes(2);
  });

  it("throws immediately without retrying when VSAC rejects the API key", async () => {
    mockGetVsacValueSet.mockRejectedValue(
      new Error("VSAC rejected the UMLS API key", {
        cause: MISSING_API_KEY_LITERAL,
      }),
    );

    await expect(
      fetchValueSetsFromVsac(mockErsdPayload, 10, VSAC_MAX_FETCH_RETRIES),
    ).rejects.toThrow("VSAC API key invalid or missing");

    expect(mockGetVsacValueSet).toHaveBeenCalledTimes(1);
  });

  it("throws immediately on a missing API Key", async () => {
    mockGetVsacValueSet.mockRejectedValue(
      new Error("UMLS API Key not set", { cause: INVALID_API_KEY_LITERAL }),
    );
    await expect(
      fetchValueSetsFromVsac(mockErsdPayload, 10, VSAC_MAX_FETCH_RETRIES),
    ).rejects.toThrow("VSAC API key invalid or missing");
    expect(mockGetVsacValueSet).toHaveBeenCalledTimes(1);
  });

  it("throws after exhausting retries on a persistent transport failure", async () => {
    mockGetVsacValueSet.mockRejectedValue(new Error("fetch failed"));

    const promise = fetchValueSetsFromVsac(
      mockErsdPayload,
      10,
      VSAC_MAX_FETCH_RETRIES,
    );
    const assertion = expect(promise).rejects.toThrow(
      /VSAC fetch failed after 4 attempts/,
    );
    await jest.runAllTimersAsync();
    await assertion;

    expect(mockGetVsacValueSet).toHaveBeenCalledTimes(4);
  });
});
