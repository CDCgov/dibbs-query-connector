import { auth } from "@/auth";
import { Bundle, BundleEntry, Patient } from "fhir/r4";
import { readJsonFile } from "../shared_utils/readJsonFile";
import { hyperUnluckyPatient, USE_CASE_DETAILS } from "@/app/shared/constants";
import {
  patientDiscoveryQuery,
  PatientDiscoveryRequest,
} from "@/app/shared/query-service";
import { getDbClient } from "@/app/backend/dbClient";

const dbClient = getDbClient();

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

const SYPHILIS_QUERY_ID = USE_CASE_DETAILS.syphilis.id;

describe("audit log", () => {
  it("patient discovery should generate an audit entry", async () => {
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
});
