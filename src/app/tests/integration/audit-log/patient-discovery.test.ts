jest.mock("@/app/backend/fhir-servers/fhir-client");
jest.mock("@/app/backend/db/decorators/auth");
jest.mock("@/app/backend/db/decorators/util");
(auth as jest.Mock).mockResolvedValue(TEST_USER);

import { hyperUnluckyPatient, USE_CASE_DETAILS } from "@/app/constants";
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
import { getAuditEntry, TEST_USER } from "./utils";
import { auth } from "@/auth";

describe("patient queries", () => {
  beforeEach(() => {
    suppressConsoleLogs();
  });

  afterEach(() => {
    jest.clearAllMocks();
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
  }, 10000);

  it("patient records query should generate an audit entry", async () => {
    const actionTypeToCheck = "makePatientRecordsRequest";

    const request: PatientRecordsRequest = {
      fhirServer: "Aidbox",
      patientId: hyperUnluckyPatient.Id,
      queryName: USE_CASE_DETAILS.chlamydia.queryName,
    };
    await patientRecordsQuery(request);

    const auditEntry = await getAuditEntry(actionTypeToCheck);
    expect(JSON.parse(auditEntry?.fhirServer)).toBe(request.fhirServer);
    expect(JSON.parse(auditEntry?.patientId)).toBe(request.patientId);
    expect(JSON.parse(auditEntry?.savedQuery).queryData).toStrictEqual(
      DEFAULT_CHLAMYDIA_QUERY.queryData,
    );
  }, 10000);
});
