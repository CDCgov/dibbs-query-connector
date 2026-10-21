import { hyperUnluckyPatient, USE_CASE_DETAILS } from "@/constants";
import {
  patientDiscoveryQuery,
  patientRecordsQuery,
} from "@/app/backend/query-execution/service";
import { suppressConsoleLogs } from "../fixtures";
import { DEFAULT_CHLAMYDIA_QUERY } from "../../unit/fixtures";
import {
  PatientDiscoveryRequest,
  PatientRecordsRequest,
} from "@/app/models/entities/query";
import dbService from "@/app/backend/db/service";
import { getAuditEntry } from "./utils";

// Mock the FHIRClient to prevent real authentication requests
jest.mock("@/app/backend/fhir-servers/fhir-client", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockResolvedValue({
        resourceType: "Bundle",
        entry: [
          {
            resource: {
              resourceType: "Patient",
              id: "test-patient-123",
              name: [{ given: ["Test"], family: "Patient" }],
              identifier: [{ value: "MRN-12345" }],
            },
          },
        ],
      }),
      post: jest.fn().mockResolvedValue({
        status: 200,
        url: "http://mock-server.com/fhir",
        text: jest.fn().mockResolvedValue(""),
        json: jest.fn().mockResolvedValue({
          resourceType: "Bundle",
          entry: [],
        }),
      }),
      getAccessToken: jest.fn().mockResolvedValue("mock-token"),
      ensureValidToken: jest.fn().mockResolvedValue(undefined),
      getRequestLog: jest.fn().mockReturnValue([]),
    })),
  };
});

jest.mock("@/app/backend/db/decorators/auth");

describe("patient queries", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });

  beforeEach(async () => {
    await dbService.query("TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE");
  });

  it("patient discovery query should generate an audit entry", async () => {
    const actionTypeToCheck = "makePatientDiscoveryRequest";

    const request: PatientDiscoveryRequest = {
      fhirServer: "Aidbox",
      firstName: hyperUnluckyPatient.FirstName,
      lastName: hyperUnluckyPatient.LastName,
      dob: hyperUnluckyPatient.DOB,
      mrn: hyperUnluckyPatient.MRN,
      phone: hyperUnluckyPatient.Phone,
    };
    await patientDiscoveryQuery(request);
    const auditEntry = await getAuditEntry(actionTypeToCheck);

    expect(auditEntry).toStrictEqual({
      request: JSON.stringify(request),
    });
  });

  it("patient records query should generate an audit entry", async () => {
    const actionTypeToCheck = "makePatientRecordsRequest";

    const request: PatientRecordsRequest = {
      fhirServer: "Aidbox",
      patientId: hyperUnluckyPatient.Id,
      queryName: USE_CASE_DETAILS.chlamydia.queryName,
    };
    await patientRecordsQuery(request);
    const auditEntry = await getAuditEntry(actionTypeToCheck);
    const auditValues = auditEntry?.auditMessage;
    expect(JSON.parse(auditValues?.fhirServer)).toBe(request.fhirServer);
    expect(JSON.parse(auditValues?.patientId)).toBe(request.patientId);
    expect(JSON.parse(auditValues?.savedQuery).queryData).toStrictEqual(
      DEFAULT_CHLAMYDIA_QUERY.queryData,
    );
  });
});
