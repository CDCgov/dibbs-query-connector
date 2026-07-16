import { Patient } from "fhir/r4";
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

const PATIENT_ID = "TlYwMDAwfDM5NzM1NjQ";
const SNOMED_CODE = "14189004";

const PATIENT: Patient = {
  resourceType: "Patient",
  id: PATIENT_ID,
  name: [
    { use: "official", given: ["WayneTWOIZG"], family: "WatersSNHDIZGTWO" },
  ],
  birthDate: "2018-02-19",
};

/**
 * A saved query with an immunization section plus condition codes and other
 * record sections, mirroring SNHD's MMR query — the gateway can only answer
 * the immunization part.
 * @returns the saved query table row
 */
function buildSavedQuery(): QueryTableResult {
  const conditionsValueSet: DibbsValueSet = {
    valueSetId: "vs-conditions",
    valueSetVersion: "1",
    valueSetName: "Test Conditions",
    author: "test",
    system: "http://snomed.info/sct",
    dibbsConceptType: "conditions",
    includeValueSet: true,
    concepts: [{ code: SNOMED_CODE, display: "Measles", include: true }],
    userCreated: false,
  };

  const queryData: QueryDataColumn = {
    "condition-1": { "vs-conditions": conditionsValueSet },
  };

  return {
    queryName: "MMR check",
    queryId: "query-mmr",
    queryData,
    conditionsList: [],
    medicalRecordSections: {
      ...EMPTY_MEDICAL_RECORD_SECTIONS,
      immunizations: true,
      socialDeterminants: true,
      serviceRequests: true,
    },
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

describe("patientRecordsQuery against an Immunization Gateway", () => {
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
      {
        name: "IZ Gateway",
        queryStrategy: "default",
        endpointType: "immunization",
      },
      {
        name: "Epic IZ Gateway",
        queryStrategy: "epic",
        endpointType: "immunization",
      },
    ]);
    (getSavedQueryByName as jest.Mock).mockResolvedValue(buildSavedQuery());

    mockFhirClient.get.mockImplementation(async (path: string) =>
      mockBundleResponse(path, EMPTY_BUNDLE),
    );
    mockFhirClient.post.mockImplementation(async (path: string) =>
      mockBundleResponse(path, EMPTY_BUNDLE),
    );
  });

  async function runQuery(fhirServer = "IZ Gateway", patient?: Patient) {
    return patientRecordsQuery({
      patientId: PATIENT_ID,
      fhirServer,
      queryName: "MMR check",
      patient,
    });
  }

  it.each(["IZ Gateway", "Epic IZ Gateway"])(
    "searches Immunization with chained patient demographics on %s",
    async (server) => {
      await runQuery(server, PATIENT);

      const getPaths = mockFhirClient.get.mock.calls.map((c) => c[0] as string);
      const immunizationPath = getPaths.find((p) =>
        p.startsWith("/Immunization?"),
      );
      // The gateway translates the search into an HL7v2 QBP query, which
      // identifies the patient by demographics — a patient={id} search
      // returns nothing.
      expect(immunizationPath).toBe(
        "/Immunization?patient.given=WayneTWOIZG&patient.family=WatersSNHDIZGTWO&patient.birthdate=2018-02-19",
      );
    },
  );

  it.each(["IZ Gateway", "Epic IZ Gateway"])(
    "sends only the Immunization search to %s, skipping other record sections",
    async (server) => {
      await runQuery(server, PATIENT);

      // The gateway only serves immunization history, so the other sections
      // in the saved query (social history, service requests, labs POST
      // batch, and the epic medication/condition chains) never fire.
      const getPaths = mockFhirClient.get.mock.calls.map((c) => c[0] as string);
      expect(getPaths).toHaveLength(1);
      expect(getPaths[0]).toMatch(/^\/Immunization\?/);
      expect(mockFhirClient.post).not.toHaveBeenCalled();
      expect(mockFhirClient.postJson).not.toHaveBeenCalled();
    },
  );

  it("falls back to the patient param when no Patient resource is provided", async () => {
    await runQuery("IZ Gateway");

    let getPaths = mockFhirClient.get.mock.calls.map((c) => c[0] as string);
    expect(getPaths.find((p) => p.startsWith("/Immunization?"))).toBe(
      `/Immunization?patient=Patient%2F${PATIENT_ID}`,
    );

    jest.clearAllMocks();
    (prepareFhirClient as jest.Mock).mockResolvedValue(mockFhirClient);
    mockFhirClient.get.mockImplementation(async (path: string) =>
      mockBundleResponse(path, EMPTY_BUNDLE),
    );
    mockFhirClient.getRequestLog.mockReturnValue([]);
    await runQuery("Epic IZ Gateway");

    getPaths = mockFhirClient.get.mock.calls.map((c) => c[0] as string);
    expect(getPaths.find((p) => p.startsWith("/Immunization?"))).toBe(
      `/Immunization?patient=${PATIENT_ID}`,
    );
  });

  it("returns the gateway's Immunizations from the parsed response", async () => {
    const gatewayBundle = {
      resourceType: "Bundle",
      type: "searchset",
      entry: [
        {
          resource: { resourceType: "Immunization", id: "imm-1" },
          search: { mode: "match" },
        },
        {
          resource: { resourceType: "Immunization", id: "imm-2" },
          search: { mode: "match" },
        },
      ],
    };
    mockFhirClient.get.mockImplementation(async (path: string) =>
      path.startsWith("/Immunization?")
        ? mockBundleResponse(path, gatewayBundle)
        : mockBundleResponse(path, EMPTY_BUNDLE),
    );

    const result = await runQuery("IZ Gateway", PATIENT);

    expect(result.Immunization?.map((i) => i.id)).toEqual(["imm-1", "imm-2"]);
  });
});
