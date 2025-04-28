import { auth } from "@/auth";
import { Bundle, BundleEntry, Patient } from "fhir/r4";
import { readJsonFile } from "../shared_utils/readJsonFile";
import { hyperUnluckyPatient, USE_CASE_DETAILS } from "@/app/shared/constants";
import {
  patientDiscoveryQuery,
  PatientDiscoveryRequest,
  patientRecordsQuery,
  PatientRecordsRequest,
} from "@/app/backend/query-execution";
import { getDbClient } from "@/app/backend/dbClient";
import {
  AUDIT_LOG_MAX_RETRIES,
  auditable,
} from "@/app/backend/auditLogs/decorator";
import * as DecoratorUtils from "@/app/backend/auditLogs/lib";
import { suppressConsoleLogs } from "./fixtures";
import { DEFAULT_CHLAMYDIA_QUERY } from "../unit/fixtures";

const dbClient = getDbClient();

jest.mock("@/app/backend/auditLogs/lib", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@/app/backend/auditLogs/lib"),
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
      fhirServer: "Aidbox",
      firstName: hyperUnluckyPatient.FirstName,
      lastName: hyperUnluckyPatient.LastName,
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

    expect(addedVal[0]?.action_type).toBe("makePatientDiscoveryRequest");
    expect(addedVal[0]?.audit_message).toStrictEqual({
      request: JSON.stringify(request),
    });
  });

  it("patient records query should generate an audit entry", async () => {
    const auditQuery = "SELECT * FROM audit_logs;";
    const auditRows = await dbClient.query(auditQuery);
    const auditRowIds = auditRows.rows.map((v) => v.id);

    const request: PatientRecordsRequest = {
      fhirServer: "Aidbox",
      patientId: hyperUnluckyPatient.Id,
      queryName: USE_CASE_DETAILS.chlamydia.queryName,
    };
    await patientRecordsQuery(request);

    const newAuditRows = await dbClient.query(auditQuery);

    const addedVal = newAuditRows.rows.filter((item) => {
      return !auditRowIds.includes(item.id);
    });

    expect(addedVal[0]?.action_type).toBe("makePatientRecordsRequest");
    expect(JSON.parse(addedVal[0]?.audit_message?.fhirServer)).toBe(
      request.fhirServer,
    );
    expect(JSON.parse(addedVal[0]?.audit_message?.patientId)).toBe(
      request.patientId,
    );
    expect(JSON.parse(addedVal[0]?.audit_message?.queryData)).toStrictEqual(
      DEFAULT_CHLAMYDIA_QUERY.query_data,
    );
    expect(addedVal[0]?.audit_checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it("an audited function should retries successfully", async () => {
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

  it("should block UPDATEs and DELETE for audit_logs", async () => {
    const request: PatientDiscoveryRequest = {
      fhirServer: "Aidbox",
      firstName: hyperUnluckyPatient.FirstName,
      lastName: hyperUnluckyPatient.LastName,
      dob: hyperUnluckyPatient.DOB,
      mrn: hyperUnluckyPatient.MRN,
      phone: hyperUnluckyPatient.Phone,
    };

    await patientDiscoveryQuery(request);

    const result = await dbClient.query(
      "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1",
    );
    const insertedId = result.rows[0].id;

    await expect(
      dbClient.query(`UPDATE audit_logs SET author = 'hacker' WHERE id = $1`, [
        insertedId,
      ]),
    ).rejects.toThrow(/UPDATEs to audit_logs are not permitted/i);

    await expect(
      dbClient.query(`DELETE FROM audit_logs WHERE id = $1`, [insertedId]),
    ).rejects.toThrow(/DELETEs from audit_logs are not permitted/i);
  });
});

describe("generateAuditChecksum", () => {
  it("produces correct checksum for audit message with stringified request", () => {
    const author = "WorfSonOfMogh";
    const timestamp = "2024-04-10T17:12:45.123Z";

    const audit_message = {
      request: JSON.stringify({
        fhir_server: "Aidbox",
        first_name: "Testy",
        last_name: "McTestface",
        dob: "1970-01-01",
        mrn: "1234567",
        phone: "555-123-4567",
      }),
    };

    const checksum = DecoratorUtils.generateAuditChecksum(
      author,
      audit_message,
      timestamp,
    );

    const expected = require("crypto")
      .createHash("sha256")
      .update(
        JSON.stringify({
          author,
          auditContents: audit_message,
          timestamp,
        }),
      )
      .digest("hex");

    expect(checksum).toBe(expected);
  });
});
