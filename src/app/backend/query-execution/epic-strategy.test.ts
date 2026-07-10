import { patientRecordsQuery } from "./service";
import {
  getFhirServerConfigs,
  prepareFhirClient,
} from "@/app/backend/fhir-servers/service";
import { getSavedQueryByName } from "@/app/backend/query-building/service";
import FHIRClient from "@/app/backend/fhir-servers/fhir-client";
import {
  EMPTY_MEDICAL_RECORD_SECTIONS,
  QueryDataColumn,
  QueryTableResult,
} from "@/app/(pages)/queryBuilding/utils";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { suppressConsoleLogs } from "@/app/tests/integration/fixtures";

jest.mock("@/app/utils/auth", () => ({
  superAdminAccessCheck: jest.fn().mockReturnValue(true),
}));

jest.mock("@/app/backend/fhir-servers/service", () => ({
  prepareFhirClient: jest.fn(),
  getFhirServerConfigs: jest.fn(),
  getFhirServerNames: jest.fn(),
}));

jest.mock("@/app/backend/query-building/service", () => ({
  getSavedQueryByName: jest.fn(),
}));

jest.mock("@/app/backend/audit-logs/decorator", () => ({
  auditable: jest
    .fn()
    .mockImplementation(
      () =>
        (
          _target: unknown,
          _propertyName: string,
          descriptor: PropertyDescriptor,
        ) =>
          descriptor,
    ),
}));

const PATIENT_ID = "patient-123";
const LOINC_CODE = "5199-7";
const RXNORM_CODE = "1665005";
const OTHER_RXNORM_CODE = "999999";
const SNOMED_CODE = "240589008";

function buildSavedQuery(): QueryTableResult {
  const labsValueSet: DibbsValueSet = {
    valueSetId: "vs-labs",
    valueSetVersion: "1",
    valueSetName: "Test Labs",
    author: "test",
    system: "http://loinc.org",
    dibbsConceptType: "labs",
    includeValueSet: true,
    concepts: [{ code: LOINC_CODE, display: "HIV test", include: true }],
    userCreated: false,
  };

  const medicationsValueSet: DibbsValueSet = {
    valueSetId: "vs-meds",
    valueSetVersion: "1",
    valueSetName: "Test Medications",
    author: "test",
    system: "http://www.nlm.nih.gov/research/umls/rxnorm",
    dibbsConceptType: "medications",
    includeValueSet: true,
    concepts: [{ code: RXNORM_CODE, display: "some drug", include: true }],
    userCreated: false,
  };

  const conditionsValueSet: DibbsValueSet = {
    valueSetId: "vs-conditions",
    valueSetVersion: "1",
    valueSetName: "Test Conditions",
    author: "test",
    system: "http://snomed.info/sct",
    dibbsConceptType: "conditions",
    includeValueSet: true,
    concepts: [{ code: SNOMED_CODE, display: "some condition", include: true }],
    userCreated: false,
  };

  const queryData: QueryDataColumn = {
    "condition-1": {
      "vs-labs": labsValueSet,
      "vs-meds": medicationsValueSet,
      "vs-conditions": conditionsValueSet,
    },
  };

  return {
    queryName: "HIV screening",
    queryId: "query-hiv",
    queryData,
    conditionsList: [],
    medicalRecordSections: EMPTY_MEDICAL_RECORD_SECTIONS,
  };
}

/**
 * Builds a mock 200 Response whose clone() re-reads the same bundle.
 * @param path the request path, echoed into the mock URL
 * @param bundle the bundle the response body resolves to
 * @returns a mock Response
 */
function mockBundleResponse(path: string, bundle: object): Response {
  const response = {
    status: 200,
    url: `https://example.com/fhir${path}`,
    json: async () => bundle,
    clone: () => ({ json: async () => bundle }),
  };
  return response as unknown as Response;
}

const EMPTY_BUNDLE = { resourceType: "Bundle", type: "searchset", entry: [] };

describe("patientRecordsQuery with the epic query strategy", () => {
  let mockFhirClient: jest.Mocked<FHIRClient>;

  beforeEach(() => {
    suppressConsoleLogs();
    jest.clearAllMocks();

    mockFhirClient = {
      get: jest.fn(),
      post: jest.fn(),
      postJson: jest.fn(),
      getBatch: jest.fn(),
      getRequestLog: jest.fn().mockReturnValue([]),
    } as unknown as jest.Mocked<FHIRClient>;

    (prepareFhirClient as jest.Mock).mockResolvedValue(mockFhirClient);
    (getFhirServerConfigs as jest.Mock).mockResolvedValue([
      { name: "Epic Server", queryStrategy: "epic" },
      { name: "Standard Server", queryStrategy: "default" },
    ]);
    (getSavedQueryByName as jest.Mock).mockResolvedValue(buildSavedQuery());

    mockFhirClient.get.mockImplementation(async (path: string) =>
      mockBundleResponse(path, EMPTY_BUNDLE),
    );
    mockFhirClient.post.mockImplementation(async (path: string) =>
      mockBundleResponse(path, EMPTY_BUNDLE),
    );
  });

  async function runQuery(fhirServer = "Epic Server") {
    return patientRecordsQuery({
      patientId: PATIENT_ID,
      fhirServer,
      queryName: "HIV screening",
    });
  }

  it("issues GETs (not POST _search) for medications, conditions, and encounters", async () => {
    const conditionBundle = {
      resourceType: "Bundle",
      type: "searchset",
      entry: [{ resource: { resourceType: "Condition", id: "cond-1" } }],
    };
    mockFhirClient.get.mockImplementation(async (path: string) => {
      if (path.startsWith("/Condition")) {
        return mockBundleResponse(path, conditionBundle);
      }
      return mockBundleResponse(path, EMPTY_BUNDLE);
    });

    await runQuery();

    const getPaths = mockFhirClient.get.mock.calls.map((c) => c[0] as string);
    const postPaths = mockFhirClient.post.mock.calls.map((c) => c[0] as string);

    // Epic-incompatible resources go out as GETs, scoped by a bare patient id
    // (Epic doesn't match Patient/-prefixed reference values)...
    expect(getPaths.find((p) => p.startsWith("/MedicationRequest?"))).toContain(
      `patient=${PATIENT_ID}`,
    );
    expect(
      getPaths.find((p) => p.startsWith("/MedicationRequest?")),
    ).not.toContain("patient=Patient%2F");
    expect(getPaths.find((p) => p.startsWith("/Condition?"))).toContain(
      `patient=${PATIENT_ID}&code=${SNOMED_CODE}`,
    );
    // ...with no code filter on the medication search.
    expect(
      getPaths.find((p) => p.startsWith("/MedicationRequest?")),
    ).not.toContain("code=");

    // Epic has no R4 MedicationStatement endpoint, so it's never queried.
    expect(getPaths.some((p) => p.includes("MedicationStatement"))).toBe(false);

    // The Encounter GET is driven by the returned Condition id.
    expect(getPaths.find((p) => p.startsWith("/Encounter?"))).toContain(
      "diagnosis=Condition%2Fcond-1",
    );
    expect(getPaths.find((p) => p.startsWith("/Encounter?"))).toContain(
      `patient=${PATIENT_ID}`,
    );

    // None of these resources are POSTed in epic mode; Observation and
    // DiagnosticReport still use POST _search.
    expect(postPaths).toEqual(
      expect.arrayContaining([
        "/Observation/_search",
        "/DiagnosticReport/_search",
      ]),
    );
    for (const path of postPaths) {
      expect(path).not.toMatch(
        /MedicationRequest|MedicationStatement|Condition|Encounter/,
      );
    }
  });

  it("skips the Encounter search when no Conditions match", async () => {
    await runQuery();

    const getPaths = mockFhirClient.get.mock.calls.map((c) => c[0] as string);
    expect(getPaths.some((p) => p.startsWith("/Condition?"))).toBe(true);
    expect(getPaths.some((p) => p.startsWith("/Encounter?"))).toBe(false);
  });

  it("still returns other resources when the Condition search fails", async () => {
    const observation = {
      resourceType: "Observation",
      id: "obs-1",
      status: "final",
      code: { text: "HIV test" },
    };
    mockFhirClient.get.mockImplementation(async (path: string) => {
      if (path.startsWith("/Condition")) {
        throw new Error("ECONNRESET");
      }
      return mockBundleResponse(path, EMPTY_BUNDLE);
    });
    mockFhirClient.post.mockImplementation(async (path: string) => {
      if (path.startsWith("/Observation")) {
        return mockBundleResponse(path, {
          resourceType: "Bundle",
          type: "searchset",
          entry: [{ resource: observation }],
        });
      }
      return mockBundleResponse(path, EMPTY_BUNDLE);
    });

    const result = await runQuery();

    expect(result.Observation).toHaveLength(1);
    expect(result.Encounter).toBeUndefined();
  });

  it("filters medication resources to the query's codes client-side", async () => {
    const medicationBundle = {
      resourceType: "Bundle",
      type: "searchset",
      entry: [
        {
          resource: {
            resourceType: "MedicationRequest",
            id: "mr-match",
            status: "active",
            intent: "order",
            subject: { reference: `Patient/${PATIENT_ID}` },
            medicationReference: { reference: "Medication/med-match" },
          },
        },
        {
          resource: {
            resourceType: "MedicationRequest",
            id: "mr-other",
            status: "active",
            intent: "order",
            subject: { reference: `Patient/${PATIENT_ID}` },
            medicationReference: { reference: "Medication/med-other" },
          },
        },
        {
          resource: {
            resourceType: "Medication",
            id: "med-match",
            code: { coding: [{ code: RXNORM_CODE }] },
          },
        },
        {
          resource: {
            resourceType: "Medication",
            id: "med-other",
            code: { coding: [{ code: OTHER_RXNORM_CODE }] },
          },
        },
      ],
    };
    mockFhirClient.get.mockImplementation(async (path: string) => {
      if (path.startsWith("/MedicationRequest")) {
        return mockBundleResponse(path, medicationBundle);
      }
      return mockBundleResponse(path, EMPTY_BUNDLE);
    });

    const result = await runQuery();

    expect(result.MedicationRequest?.map((r) => r.id)).toEqual(["mr-match"]);
    expect(result.Medication?.map((m) => m.id)).toEqual(["med-match"]);

    // The searched bundle already included the Medications, so no follow-up
    // reads were needed.
    const medicationReads = mockFhirClient.get.mock.calls
      .map((c) => c[0] as string)
      .filter((p) => p.startsWith("/Medication/"));
    expect(medicationReads).toEqual([]);
  });

  it("reads referenced Medications the search didn't include (Epic ignores _include)", async () => {
    const medicationRequest = (id: string, medicationId: string) => ({
      resource: {
        resourceType: "MedicationRequest",
        id,
        status: "active",
        intent: "order",
        subject: { reference: `Patient/${PATIENT_ID}` },
        medicationReference: { reference: `Medication/${medicationId}` },
      },
    });
    const medicationBundle = {
      resourceType: "Bundle",
      type: "searchset",
      entry: [
        medicationRequest("mr-match", "med-match"),
        medicationRequest("mr-other", "med-other"),
        // Second request for the same drug: the Medication is read only once.
        medicationRequest("mr-match-2", "med-match"),
      ],
    };
    mockFhirClient.get.mockImplementation(async (path: string) => {
      if (path.startsWith("/MedicationRequest")) {
        return mockBundleResponse(path, medicationBundle);
      }
      // Reads return the bare resource, not a searchset Bundle.
      if (path === "/Medication/med-match") {
        return mockBundleResponse(path, {
          resourceType: "Medication",
          id: "med-match",
          code: { coding: [{ code: RXNORM_CODE }] },
        });
      }
      if (path === "/Medication/med-other") {
        return mockBundleResponse(path, {
          resourceType: "Medication",
          id: "med-other",
          code: { coding: [{ code: OTHER_RXNORM_CODE }] },
        });
      }
      return mockBundleResponse(path, EMPTY_BUNDLE);
    });

    const result = await runQuery();

    // Each distinct referenced Medication is read exactly once...
    const medicationReads = mockFhirClient.get.mock.calls
      .map((c) => c[0] as string)
      .filter((p) => p.startsWith("/Medication/"));
    expect(medicationReads.sort()).toEqual([
      "/Medication/med-match",
      "/Medication/med-other",
    ]);

    // ...which lets the client-side code filter evaluate every request and
    // surfaces the matching Medication (with its name) in the response.
    expect(result.MedicationRequest?.map((r) => r.id).sort()).toEqual([
      "mr-match",
      "mr-match-2",
    ]);
    expect(result.Medication?.map((m) => m.id)).toEqual(["med-match"]);
  });

  it("keeps medication requests whose Medication read fails (fail open)", async () => {
    const medicationBundle = {
      resourceType: "Bundle",
      type: "searchset",
      entry: [
        {
          resource: {
            resourceType: "MedicationRequest",
            id: "mr-unresolved",
            status: "active",
            intent: "order",
            subject: { reference: `Patient/${PATIENT_ID}` },
            medicationReference: { reference: "Medication/med-gone" },
          },
        },
      ],
    };
    mockFhirClient.get.mockImplementation(async (path: string) => {
      if (path.startsWith("/MedicationRequest")) {
        return mockBundleResponse(path, medicationBundle);
      }
      if (path === "/Medication/med-gone") {
        return {
          status: 404,
          url: `https://example.com/fhir${path}`,
          text: async () => "Not found",
        } as unknown as Response;
      }
      return mockBundleResponse(path, EMPTY_BUNDLE);
    });

    const result = await runQuery();

    expect(result.MedicationRequest?.map((r) => r.id)).toEqual([
      "mr-unresolved",
    ]);
  });

  it("keeps the default POST _search behavior for default-strategy servers", async () => {
    await runQuery("Standard Server");

    const postPaths = mockFhirClient.post.mock.calls.map((c) => c[0] as string);
    expect(postPaths).toEqual(
      expect.arrayContaining([
        "/MedicationRequest/_search",
        "/MedicationStatement/_search",
        "/Condition/_search",
        "/Encounter/_search",
      ]),
    );
    const getPaths = mockFhirClient.get.mock.calls.map((c) => c[0] as string);
    expect(getPaths.some((p) => p.startsWith("/Condition?"))).toBe(false);
  });
});
