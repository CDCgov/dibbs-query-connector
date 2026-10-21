import {
  AUDIT_LOG_MAX_RETRIES,
  auditable,
} from "@/app/backend/audit-logs/decorator";
import { patientDiscoveryQuery } from "@/app/backend/query-execution/service";
import { PatientDiscoveryRequest } from "@/app/models/entities/query";
import { hyperUnluckyPatient } from "@/constants";
import * as DecoratorUtils from "@/app/backend/audit-logs/lib";
import { suppressConsoleLogs } from "../fixtures";
import { auth } from "@/auth";
import { TEST_USER } from "./utils";
import dbService from "@/app/backend/db/service";

jest.mock("@/app/backend/audit-logs/lib", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@/app/backend/audit-logs/lib"),
  };
});

jest.mock("@/app/backend/db/decorators/auth");

const mockBody = {
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
};
const mockResponse = {
  status: 200,
  statusText: "OK",
  headers: new Headers({ "content-type": "application/json" }),
  clone: () => mockResponse,
  json: async () => mockBody,
  ...mockBody,
};

// Mock the FHIRClient to prevent real authentication requests
jest.mock("@/app/backend/fhir-servers/fhir-client");

(auth as jest.Mock).mockResolvedValue(TEST_USER);

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
    const querySpy = jest.spyOn(dbService, "query");
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
    const result = await dbService.query(
      "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1",
    );
    const insertedId = result.rows[0].id;
    await expect(
      dbService.query(`UPDATE audit_logs SET author = 'hacker' WHERE id = $1`, [
        insertedId,
      ]),
    ).rejects.toThrow(/UPDATEs to audit_logs are not permitted/i);
    await expect(
      dbService.query(`DELETE FROM audit_logs WHERE id = $1`, [insertedId]),
    ).rejects.toThrow(/DELETEs from audit_logs are not permitted/i);
  });
});
