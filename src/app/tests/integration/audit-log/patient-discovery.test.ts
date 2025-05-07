import { auth } from "@/auth";
import { hyperUnluckyPatient, USE_CASE_DETAILS } from "@/app/shared/constants";
import {
  patientDiscoveryQuery,
  patientRecordsQuery,
} from "@/app/backend/query-execution";
import { suppressConsoleLogs } from "../fixtures";
import { DEFAULT_CHLAMYDIA_QUERY } from "../../unit/fixtures";
import {
  PatientDiscoveryRequest,
  PatientRecordsRequest,
} from "@/app/models/entities/query";
import dbService from "@/app/backend/db/client";

import * as AuditableDecorators from "@/app/backend/audit-logs/lib";
import {
  GET_ALL_AUDIT_ROWS,
  getAuditEntry,
  TEST_USER,
  waitForAuditSuccess,
} from "./utils";

jest.mock("@/app/utils/auth", () => {
  return {
    superAdminAccessCheck: jest.fn(() => Promise.resolve(true)),
    adminAccessCheck: jest.fn(() => Promise.resolve(true)),
  };
});

jest.mock("@/app/backend/auditLogs/lib", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@/app/backend/auditLogs/lib"),
  };
});

const auditCompletionSpy = jest.spyOn(
  AuditableDecorators,
  "generateAuditSuccessMessage",
);

(auth as jest.Mock).mockResolvedValue(TEST_USER);

describe("patient queries", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });

  it("patient discovery query should generate an audit entry", async () => {
    const oldAuditIds = (await dbService.query(GET_ALL_AUDIT_ROWS)).rows.map(
      (r) => r.id,
    );
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
    await waitForAuditSuccess(actionTypeToCheck, auditCompletionSpy);
    const auditEntry = await getAuditEntry(actionTypeToCheck, oldAuditIds);

    expect(auditEntry).toStrictEqual({
      request: JSON.stringify(request),
    });
  });

  it("patient records query should generate an audit entry", async () => {
    const oldAuditIds = (await dbService.query(GET_ALL_AUDIT_ROWS)).rows.map(
      (r) => r.id,
    );
    const actionTypeToCheck = "makePatientRecordsRequest";

    const request: PatientRecordsRequest = {
      fhirServer: "Aidbox",
      patientId: hyperUnluckyPatient.Id,
      queryName: USE_CASE_DETAILS.chlamydia.queryName,
    };
    await patientRecordsQuery(request);
    await waitForAuditSuccess(actionTypeToCheck, auditCompletionSpy);
    const auditEntry = await getAuditEntry(actionTypeToCheck, oldAuditIds);

    expect(JSON.parse(auditEntry?.fhirServer)).toBe(request.fhirServer);
    expect(JSON.parse(auditEntry?.patientId)).toBe(request.patientId);
    expect(JSON.parse(auditEntry?.queryData)).toStrictEqual(
      DEFAULT_CHLAMYDIA_QUERY.queryData,
    );
  });
});
