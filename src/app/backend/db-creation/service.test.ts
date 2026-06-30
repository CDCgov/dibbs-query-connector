import { DibbsValueSet } from "@/app/models/entities/valuesets";
import ExampleVsacValueSet from "../../tests/assets/VSACValueSet.json";
import { ValueSet as FhirValueSet } from "fhir/r4";
import {
  isUmbrellaErsdId,
  stripErsdVersionSuffix,
  translateVSACToInternalValueSet,
} from "./utils";
import { fetchConditionWithRetry } from "./service";
import { getVSACValueSet } from "@/app/backend/code-systems/service";
import { MISSING_API_KEY_LITERAL } from "@/app/constants";

jest.mock("@/app/backend/code-systems/service", () => ({
  getVSACValueSet: jest.fn(),
}));

const mockGetVSACValueSet = getVSACValueSet as unknown as jest.Mock;

const EXPECTED_INTERNAL_VALUESET: DibbsValueSet = {
  valueSetId: `${ExampleVsacValueSet.id}_${ExampleVsacValueSet.version}`,
  valueSetVersion: ExampleVsacValueSet.version,
  valueSetName: ExampleVsacValueSet.title,
  valueSetExternalId: ExampleVsacValueSet.id,
  author: ExampleVsacValueSet.publisher,
  system: ExampleVsacValueSet.compose.include[0].system,
  ersdConceptType: "ostc",
  dibbsConceptType: "labs",
  includeValueSet: false,
  userCreated: false,
  concepts: ExampleVsacValueSet.compose.include[0].concept.map((c) => {
    return { ...c, include: false };
  }),
};

describe("VSAC FHIR response to internal application type", () => {
  it("translate to expected fixture", () => {
    const translationResult = translateVSACToInternalValueSet(
      ExampleVsacValueSet as FhirValueSet,
      "ostc",
    );

    expect(translationResult).toEqual(EXPECTED_INTERNAL_VALUESET);
  });
});

describe("stripErsdVersionSuffix", () => {
  it("strips an 8-digit date suffix from an eRSD v3 resource id", () => {
    expect(
      stripErsdVersionSuffix("2.16.840.1.113762.1.4.1146.560-20240619"),
    ).toBe("2.16.840.1.113762.1.4.1146.560");
  });

  it("leaves bare OIDs (eRSD v1/v2) unchanged", () => {
    expect(stripErsdVersionSuffix("2.16.840.1.113762.1.4.1146.560")).toBe(
      "2.16.840.1.113762.1.4.1146.560",
    );
  });

  it("does not strip umbrella version suffixes (semver-like)", () => {
    expect(stripErsdVersionSuffix("dxtc-3.1.2")).toBe("dxtc-3.1.2");
  });

  it("returns an empty string unchanged", () => {
    expect(stripErsdVersionSuffix("")).toBe("");
  });
});

describe("isUmbrellaErsdId", () => {
  it("matches bare umbrella prefixes (eRSD v1/v2)", () => {
    expect(isUmbrellaErsdId("dxtc")).toBe(true);
    expect(isUmbrellaErsdId("ostc")).toBe(true);
  });

  it("matches versioned umbrella ids (eRSD v3)", () => {
    expect(isUmbrellaErsdId("dxtc-3.1.2")).toBe(true);
    expect(isUmbrellaErsdId("sdtc-3.1.2")).toBe(true);
  });

  it("does not match non-umbrella OIDs", () => {
    expect(isUmbrellaErsdId("2.16.840.1.113762.1.4.1146.560")).toBe(false);
    expect(isUmbrellaErsdId("2.16.840.1.113762.1.4.1146.560-20240619")).toBe(
      false,
    );
  });

  it("returns false for undefined or empty ids", () => {
    expect(isUmbrellaErsdId(undefined)).toBe(false);
    expect(isUmbrellaErsdId("")).toBe(false);
  });
});

describe("fetchConditionWithRetry", () => {
  const CONDITION = "code1*system1*Condition One";
  const PARAMS_RESPONSE = {
    resourceType: "Parameters",
    parameter: [{ name: "version", valueString: "http://vsac/version/2024" }],
  };
  const OPERATION_OUTCOME = {
    resourceType: "OperationOutcome",
    issue: [
      { severity: "error", code: "processing", diagnostics: "503: down" },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
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
