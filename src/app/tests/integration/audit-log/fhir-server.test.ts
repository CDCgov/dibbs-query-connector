// import dbService from "@/app/backend/db/service";
// import { getAuditEntry, TEST_USER } from "./utils";
// import {
//   insertFhirServer,
//   updateFhirServer,
//   deleteFhirServer,
// } from "@/app/backend/fhir-servers/service";
// import { auth } from "@/auth";
// import { FhirServerConfig } from "@/app/models/entities/fhir-servers";

// jest.mock("@/app/backend/db/decorators/auth");
// (auth as jest.Mock).mockResolvedValue(TEST_USER);

// describe("fhir server", () => {
//   beforeAll(() => {
//     // suppressConsoleLogs();
//   });

//   beforeEach(async () => {
//     await dbService.query("TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE");
//   });

//   it("fhir server addition / deletion / update", async () => {
//     const TEST_FHIR_SERVER = {
//       id: "jolly-roger-bay",
//       name: "Jolly Roger Bay",
//       hostname: "http://sunken-ship.boats/fhir",
//       headers: undefined,
//       lastConnectionSuccessful: true,
//       disableCertValidation: false,
//       defaultServer: false,
//       authType: "none",
//     } as FhirServerConfig;

//     // insert
//     const result = await insertFhirServer(
//       TEST_FHIR_SERVER.name,
//       TEST_FHIR_SERVER.hostname,
//       TEST_FHIR_SERVER.disableCertValidation,
//       TEST_FHIR_SERVER.defaultServer,
//       TEST_FHIR_SERVER.lastConnectionSuccessful,
//     );
//     const actionTypeToCheck = "insertFhirServer";

//     const auditEntry = await getAuditEntry(actionTypeToCheck);
//     expect(auditEntry?.actionType).toBe(actionTypeToCheck);

//     const auditValues = auditEntry?.auditMessage;
//     expect(JSON.parse(auditValues.name)).toBe(TEST_FHIR_SERVER.name);
//     expect(JSON.parse(auditValues.hostname)).toBe(TEST_FHIR_SERVER.hostname);
//     expect(JSON.parse(auditValues.lastConnectionSuccessful)).toBe(
//       TEST_FHIR_SERVER.lastConnectionSuccessful,
//     );

//     const updateName = "Dire Dire Docks";
//     await updateFhirServer({
//       id: result.server.id,
//       name: updateName,
//       hostname: TEST_FHIR_SERVER.hostname,
//       defaultServer: false,
//       disableCertValidation: TEST_FHIR_SERVER.disableCertValidation,
//       lastConnectionSuccessful: false,
//       authData: {
//         authType: "none",
//       },
//     });
//     const updateTypeToCheck = "updateFhirServer";
//     const updateAuditEntry = await getAuditEntry(updateTypeToCheck);

//     expect(updateAuditEntry?.actionType).toBe(actionTypeToCheck);

//     const updateAuditValues = updateAuditEntry?.auditMessage;
//     expect(JSON.parse(updateAuditValues.updateDetails).name).toBe(updateName);

//     await deleteFhirServer(result.server.id);
//     const finalTypeToCheck = "deleteFhirServer";

//     const finalEntry = await getAuditEntry(finalTypeToCheck);
//     const finalAuditValues = finalEntry?.auditMessage;

//     expect(JSON.parse(finalAuditValues.id)).toBe(result.server.id);
//   });
// });
