import { patientRecordsQuery } from "@/app/backend/query-execution/service";
import { createTestCancerQuery } from "../../../../e2e/utils";
import { suppressConsoleLogs } from "./fixtures";
import { PatientRecordsRequest } from "@/app/models/entities/query";
import { HYPER_UNLUCKY_DEFAULT_ID } from "@/app/constants";
import { updateTimeboxSettings } from "@/app/backend/query-timefiltering";

jest.mock("@/app/utils/auth", () => {
  return {
    superAdminAccessCheck: jest.fn().mockResolvedValue(true),
    adminAccessCheck: jest.fn().mockResolvedValue(true),
  };
});

describe("time filtering query", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });

  it("applies time filters to queries", async () => {
    const customCancerQuery = await createTestCancerQuery();

    const patientRecordsRequest: PatientRecordsRequest = {
      patientId: HYPER_UNLUCKY_DEFAULT_ID,
      fhirServer: "Aidbox",
      queryName: customCancerQuery.queryName,
    };
    const response = await patientRecordsQuery(patientRecordsRequest);
    // there should be three resources in the default query: 1 condition, 2 meds
    expect(Object.keys(response).length).toBe(3);

    const expectedConditionResponse = response["Condition"];
    const startFilter = new Date("2025-12-01");
    const endFilter = new Date("2025-12-05");

    // filter out med responses
    await updateTimeboxSettings(
      customCancerQuery.queryId,
      "medications",
      startFilter.toISOString(),
      endFilter.toISOString(),
    );

    const newResponse = await patientRecordsQuery(patientRecordsRequest);
    // should just have conditions left
    expect(Object.keys(newResponse).length).toBe(1);

    expect(newResponse["Condition"]).toStrictEqual(expectedConditionResponse);
  });
});
