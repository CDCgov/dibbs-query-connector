jest.mock("@/app/backend/db/decorators/auth");
jest.mock("@/app/backend/db/decorators/util");
jest.mock("@/app/backend/fhir-servers/fhir-client");

jest.mock("@/app/backend/audit-logs/lib", () => {
  const originalModule = jest.requireActual("@/app/backend/audit-logs/lib");
  return {
    __esModule: true,
    ...originalModule,
  };
});

(auth as jest.Mock).mockResolvedValue(TEST_USER);

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

describe("checks for generic audit logs", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("produces correct checksum for audit message with stringified request", () => {
    const author = "Princess Peach";
    const timestamp = "2024-04-10T17:12:45.123Z";

    const auditMessage = {
      request: JSON.stringify({
        fhir_server: "Princess Peach's Castle",
        first_name: "Princess",
        last_name: "Peach",
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

    const expectedStaticHash =
      "f5a927c0e7fcbc8001a0f0d8f2cd2fcafb580b22a51207138898f7489753b4cf";

    expect(checksum).toBe(expectedStaticHash);
  });

  it("an audited function should retry and eventually succeed", async () => {
    jest.useFakeTimers();

    const querySpy = jest.spyOn(dbService, "query");
    const generateSpy = jest.spyOn(DecoratorUtils, "generateAuditValues");

    for (let i = 0; i < AUDIT_LOG_MAX_RETRIES; i++) {
      querySpy.mockRejectedValueOnce(new Error("test error"));
    }

    querySpy.mockResolvedValueOnce({
      command: "",
      fields: [],
      oid: 0,
      rowCount: 1,
      rows: ["success"],
    });

    class MockClass {
      @auditable
      async testFunction() {
        return "success";
      }
    }

    const testObj = new MockClass();

    const promise = testObj.testFunction();
    await jest.runAllTimersAsync();

    const result = await promise;

    expect(querySpy).toHaveBeenCalledTimes(AUDIT_LOG_MAX_RETRIES);
    expect(generateSpy).toHaveBeenCalledTimes(AUDIT_LOG_MAX_RETRIES);
    expect(result).toBe("success");

    querySpy.mockRestore();
    generateSpy.mockRestore();
  });

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
    expect(insertedId).toBeDefined();
    expect(
      await dbService.query(
        `UPDATE audit_logs SET author = 'hacker' WHERE id = $1`,
        [insertedId],
      ),
    ).toEqual(emptyReturn);
    expect(
      await dbService.query(`DELETE FROM audit_logs WHERE id = $1`, [
        insertedId,
      ]),
    ).toEqual(emptyReturn);
  }, 10000);
});

const emptyReturn = { command: "", fields: [], oid: 0, rowCount: 0, rows: [] };
