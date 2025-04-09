import { auth } from "@/auth";
import { Bundle, BundleEntry, Patient } from "fhir/r4";
import { readJsonFile } from "../shared_utils/readJsonFile";
import { hyperUnluckyPatient, USE_CASE_DETAILS } from "@/app/shared/constants";
import {
  patientDiscoveryQuery,
  PatientDiscoveryRequest,
  patientRecordsQuery,
  PatientRecordsRequest,
} from "@/app/shared/query-service";
import { getDbClient } from "@/app/backend/dbClient";
import { AUDIT_LOG_MAX_RETRIES, auditable } from "@/app/auditLogs/decorator";
import * as DecoratorUtils from "@/app/auditLogs/lib";
import { suppressConsoleLogs } from "./fixtures";

const dbClient = getDbClient();

jest.mock("@/app/auditLogs/lib", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@/app/auditLogs/lib"),
  };
});

jest.mock("@/app/utils/auth", () => {
  return {
    superAdminAccessCheck: jest.fn(() => Promise.resolve(true)),
    adminAccessCheck: jest.fn(() => Promise.resolve(true)),
  };
});

const TEST_USER = {
  id: "13e1efb2-5889-4157-8f34-78d7f02dbf84",
  username: "WorfSonOfMogh",
  email: "worf_security@starfleet.com",
  firstName: "Worf",
  lastName: "Mogh",
};
(auth as jest.Mock).mockResolvedValue(TEST_USER);

const PatientBundle = readJsonFile("./src/app/tests/assets/BundlePatient.json");
const PatientResource: Patient | undefined = (
  (PatientBundle as Bundle).entry as BundleEntry[]
)[0]?.resource as Patient;

if (!PatientResource || PatientResource.resourceType !== "Patient") {
  throw new Error("Invalid Patient resource in the test bundle.");
}

describe("audit log", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it("patient discovery query should generate an audit entry", async () => {
    const auditQuery = "SELECT * FROM audit_logs;";
    const auditRows = await dbClient.query(auditQuery);

    const request: PatientDiscoveryRequest = {
      fhir_server: "Aidbox",
      first_name: hyperUnluckyPatient.FirstName,
      last_name: hyperUnluckyPatient.LastName,
      dob: hyperUnluckyPatient.DOB,
      mrn: hyperUnluckyPatient.MRN,
      phone: hyperUnluckyPatient.Phone,
    };
    await patientDiscoveryQuery(request);

    const newAuditRows = await dbClient.query(auditQuery);

    const addedVal = newAuditRows.rows.filter((item) => {
      if (!auditRows.rows.map((v) => v.id).includes(item.id)) {
        return item;
      }
    });

    expect(addedVal[0]?.action_type).toBe("patientDiscoveryQuery");
    expect(addedVal[0]?.audit_message).toStrictEqual({
      request: JSON.stringify(request),
    });
  });
  it("patient records query should generate an audit entry", async () => {
    const auditQuery = "SELECT * FROM audit_logs;";
    const auditRows = await dbClient.query(auditQuery);

    const request: PatientRecordsRequest = {
      fhir_server: "Aidbox",
      patient_id: hyperUnluckyPatient.Id,
      query_name: USE_CASE_DETAILS.gonorrhea.queryName,
    };
    await patientRecordsQuery(request);

    const newAuditRows = await dbClient.query(auditQuery);

    const addedVal = newAuditRows.rows.filter((item) => {
      if (!auditRows.rows.map((v) => v.id).includes(item.id)) {
        return item;
      }
    });

    expect(addedVal[0]?.action_type).toBe("patientRecordsQuery");
    expect(addedVal[0]?.audit_message).toStrictEqual({
      request: JSON.stringify(request),
    });

    expect(addedVal[0]?.audit_checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it("an audited function should  retries successfully", async () => {
    const auditGenerationSpy = jest.spyOn(
      DecoratorUtils,
      "generateAuditValues",
    );

    const querySpy = jest.spyOn(dbClient, "query");

    // generate errors within the query write AUDIT_LOG_MAX_RETRIES - 1 times
    for (let i = 0; i < AUDIT_LOG_MAX_RETRIES; i++) {
      querySpy.mockImplementationOnce(() => {
        throw new Error("test error");
      });
    }

    class MockClass {
      @auditable
      testFunction() {
        return;
      }
    }

    const testObj = new MockClass();
    testObj.testFunction();

    await new Promise((r) => setTimeout(r, 6000));
    expect(auditGenerationSpy).toHaveBeenCalledTimes(AUDIT_LOG_MAX_RETRIES);
  }, 10000);

  it("should generate the correct checksum based on stored message and timestamp", async () => {
    const auditQuery =
      "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1;";
    const result = await dbClient.query(auditQuery);

    if (!result || !result.rows || result.rows.length === 0) {
      throw new Error(
        "No audit logs found. Ensure an audited action ran before this test.",
      );
    }

    const latestAudit = result.rows[0];

    expect(latestAudit.audit_checksum).toMatch(/^[a-f0-9]{64}$/);

    const parsedMessage =
      typeof latestAudit.audit_message === "string"
        ? JSON.parse(latestAudit.audit_message)
        : latestAudit.audit_message;

    const recomputedChecksum = DecoratorUtils.generateAuditChecksum(
      latestAudit.author,
      parsedMessage,
      new Date(latestAudit.created_at).toISOString(),
    );
    expect(latestAudit.audit_checksum).toBe(recomputedChecksum);
  });
});
