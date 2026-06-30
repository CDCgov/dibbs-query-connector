import { patientRecordsQuery } from "./service";
import { prepareFhirClient } from "@/app/backend/fhir-servers/service";
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

  const queryData: QueryDataColumn = {
    "condition-1": { "vs-labs": labsValueSet, "vs-meds": medicationsValueSet },
  };

  return {
    queryName: "HIV screening",
    queryId: "query-hiv",
    queryData,
    conditionsList: [],
    // Immunizations on so the (throwing) Immunization GET is exercised too.
    medicalRecordSections: {
      ...EMPTY_MEDICAL_RECORD_SECTIONS,
      immunizations: true,
    },
  };
}

describe("patientRecordsQuery fault isolation", () => {
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
    (getSavedQueryByName as jest.Mock).mockResolvedValue(buildSavedQuery());
  });

  it("returns resources that succeeded even when other resources throw or 404", async () => {
    const observation = {
      resourceType: "Observation",
      id: "obs-1",
      status: "final",
      code: { text: "HIV test" },
    };
    const observationBundle = {
      resourceType: "Bundle",
      type: "searchset",
      entry: [{ resource: observation }],
    };

    // The Immunization GET fails at the network level (connection reset on an
    // unsupported endpoint) — this previously aborted the whole record.
    mockFhirClient.get.mockRejectedValue(new Error("ECONNRESET"));

    // POST _search batch: MedicationStatement 404s (unsupported), Observation
    // succeeds, everything else returns an empty 200 bundle.
    mockFhirClient.post.mockImplementation(async (path: string) => {
      if (path.includes("MedicationStatement")) {
        return {
          status: 404,
          url: `https://example.com/fhir${path}`,
          text: async () => "<html>Not found</html>",
        } as Response;
      }
      if (path.includes("Observation")) {
        return {
          status: 200,
          url: `https://example.com/fhir${path}`,
          json: async () => observationBundle,
        } as Response;
      }
      return {
        status: 200,
        url: `https://example.com/fhir${path}`,
        json: async () => ({ resourceType: "Bundle", entry: [] }),
      } as Response;
    });

    const result = await patientRecordsQuery({
      patientId: PATIENT_ID,
      fhirServer: "Test Server",
      queryName: "HIV screening",
    });

    // The successful Observation is still returned...
    expect(result.Observation).toHaveLength(1);
    expect(result.Observation?.[0]).toEqual(observation);
    // ...and the failed resources are simply absent rather than aborting.
    expect(result.MedicationStatement).toBeUndefined();
    expect(result.Immunization).toBeUndefined();

    // The Immunization GET is scoped with the FHIR R4 `patient` param and is
    // actually serialized into the URL (regression for the dropped-params bug).
    expect(mockFhirClient.get).toHaveBeenCalledWith(
      expect.stringContaining("patient=Patient"),
    );
  });
});
