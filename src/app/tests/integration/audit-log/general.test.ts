import {
  AUDIT_LOG_MAX_RETRIES,
  auditable,
} from "@/app/backend/audit-logs/decorator";
import { patientDiscoveryQuery } from "@/app/backend/query-execution";
import { PatientDiscoveryRequest } from "@/app/models/entities/query";
import { hyperUnluckyPatient } from "@/app/shared/constants";
import * as DecoratorUtils from "@/app/backend/audit-logs/lib";
import { internal_getDbClient } from "@/app/backend/db/config";
import { suppressConsoleLogs } from "../fixtures";
import { auth } from "@/auth";
import { TEST_USER } from "./utils";

jest.mock("@/app/backend/audit-logs/lib", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@/app/backend/audit-logs/lib"),
  };
});

// Mock auth functions
jest.mock("@/app/utils/auth", () => ({
  ...jest.requireActual("@/app/utils/auth"),
  superAdminAccessCheck: jest.fn().mockResolvedValue(true),
}));

// Mock the FHIRClient to prevent real authentication requests
jest.mock("@/app/shared/fhirClient", () => {
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
    })),
  };
});

(auth as jest.Mock).mockResolvedValue(TEST_USER);

const dbClient = internal_getDbClient();
describe("checks for generic audit logs", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });

  it("produces correct checksum for audit message with stringified request", () => {
    const author = "WorfSonOfMogh";
    const timestamp = "2024-04-10T17:12:45.123Z";

    const auditMessage = {
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
      auditMessage,
      timestamp,
    );

    const expected = require("crypto")
      .createHash("sha256")
      .update(
        JSON.stringify({
          author,
          auditContents: auditMessage,
          timestamp,
        }),
      )
      .digest("hex");

    expect(checksum).toBe(expected);
  });

  it("an audited function should retry successfully", async () => {
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
