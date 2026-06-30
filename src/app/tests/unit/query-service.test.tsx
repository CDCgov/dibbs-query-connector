import {
  processFhirResponse,
  parseFhirSearch,
} from "@/app/backend/query-execution/service";
import { isFhirResource } from "@/app/constants";
import { readJsonFile } from "../shared_utils/readJsonFile";
import { DiagnosticReport, Observation } from "fhir/r4";
import { QueryResponse } from "@/app/models/entities/query";
import { suppressConsoleLogs } from "../integration/fixtures";

jest.mock("@/app/utils/auth", () => ({
  superAdminAccessCheck: jest.fn().mockReturnValue(true),
}));

// Test case for processResponse
describe("process response", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });
  it("should unpack a response from the server into an array of resources", async () => {
    const patientBundle = readJsonFile(
      "./src/app/tests/assets/BundlePatient.json",
    );
    const labsBundle = readJsonFile(
      "./src/app/tests/assets/BundleLabInfo.json",
    );
    const diagnosticReportResource = labsBundle?.entry.filter(
      (e): e is { resource: DiagnosticReport } =>
        e?.resource?.resourceType === "DiagnosticReport",
    );
    const observationResources = labsBundle?.entry.filter(
      (e): e is { resource: Observation } =>
        e?.resource?.resourceType === "Observation",
    );
    patientBundle?.entry?.push(diagnosticReportResource[0]);
    observationResources.forEach((or) => {
      patientBundle?.entry?.push(or);
    });

    const response = {
      status: 200,
      json: async () => patientBundle,
    } as unknown as Response;
    const resourceArray = await processFhirResponse(response);

    // Using isFhirResource
    resourceArray.forEach((r) => {
      if (isFhirResource(r)) {
        expect(r.resourceType).toBeDefined();
      }
    });

    expect(resourceArray.length).toEqual(4);
    expect(resourceArray.find((r) => r.resourceType === "Patient")) ===
      patientBundle?.entry[0].resource;
    expect(
      resourceArray.filter((r) => r.resourceType === "Observation").length,
    ).toEqual(2);
  });

  it("returns an empty array when a 200 response has an unparseable body", async () => {
    const response = {
      status: 200,
      url: "https://example.com/fhir/MedicationStatement",
      json: async () => {
        throw new Error("Unexpected token < in JSON");
      },
    } as unknown as Response;

    await expect(processFhirResponse(response)).resolves.toEqual([]);
  });

  it("returns an empty array when a 200 response body parses to JSON null", async () => {
    const response = {
      status: 200,
      url: "https://example.com/fhir/MedicationStatement",
      json: async () => null,
    } as unknown as Response;

    await expect(processFhirResponse(response)).resolves.toEqual([]);
  });
});

// Test case for parseFhirSearch
describe("parse fhir search", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });
  it("should turn the FHIR server's response into a QueryResponse struct", async () => {
    const patientBundle = readJsonFile(
      "./src/app/tests/assets/BundlePatient.json",
    );
    const labsBundle = readJsonFile(
      "./src/app/tests/assets/BundleLabInfo.json",
    );
    const diagnosticReportEntry = labsBundle?.entry.filter(
      (e: { resource?: DiagnosticReport }) =>
        e?.resource?.resourceType === "DiagnosticReport",
    );
    const observationEntries = labsBundle?.entry.filter(
      (e: { resource?: Observation }) =>
        e?.resource?.resourceType === "Observation",
    );
    patientBundle?.entry?.push(diagnosticReportEntry[0]);
    observationEntries.forEach((or) => {
      patientBundle?.entry?.push(or);
    });

    const response = {
      status: 200,
      json: async () => patientBundle,
    } as unknown as Response;
    const queryResponse: QueryResponse = await parseFhirSearch(response);

    // Using isFhirResource
    expect((queryResponse.Patient || [{}])[0]).toEqual(
      patientBundle?.entry[0]?.resource,
    );
    expect((queryResponse.DiagnosticReport || [{}])[0]).toEqual(
      diagnosticReportEntry[0]?.resource,
    );
    expect(queryResponse.Observation?.length).toEqual(2);

    const observationResources: Observation[] = observationEntries.map(
      (oe: { resource?: Observation }) => oe.resource,
    );

    queryResponse.Observation?.forEach((o: Observation) => {
      expect(observationResources).toContain(o);
    });
  });

  it("keeps resources from good responses when one response in the array fails to parse", async () => {
    const patientBundle = readJsonFile(
      "./src/app/tests/assets/BundlePatient.json",
    );

    const goodResponse = {
      status: 200,
      json: async () => patientBundle,
    } as unknown as Response;

    // Simulates a resource (e.g. MedicationStatement) whose 200 body is not
    // valid JSON. It must not abort parsing of the other responses.
    const throwingResponse = {
      status: 200,
      url: "https://example.com/fhir/MedicationStatement",
      json: async () => {
        throw new Error("Unexpected token < in JSON");
      },
    } as unknown as Response;

    const queryResponse: QueryResponse = await parseFhirSearch([
      goodResponse,
      throwingResponse,
    ]);

    expect((queryResponse.Patient || [{}])[0]).toEqual(
      patientBundle?.entry[0]?.resource,
    );
  });
});
