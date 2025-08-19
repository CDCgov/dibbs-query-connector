import { patientRecordsQuery } from "@/app/backend/query-execution/service";
import { suppressConsoleLogs } from "./fixtures";
import { PatientRecordsRequest } from "@/app/models/entities/query";
import { HYPER_UNLUCKY_DEFAULT_ID } from "@/app/constants";
import { updateTimeboxSettings } from "@/app/backend/query-timefiltering";
import { QueryTableResult } from "@/app/(pages)/queryBuilding/utils";
import { deleteQueryByIdHelp } from "@/app/backend/query-building/lib";
import { createTestCancerQuery } from "../../../../e2e/utils";
import { internal_getDbClient } from "@/backend/db/config";

jest.mock("@/app/utils/auth", () => {
  return {
    superAdminAccessCheck: jest.fn().mockResolvedValue(true),
    adminAccessCheck: jest.fn().mockResolvedValue(true),
  };
});

describe("time filtering query", () => {
  const dbClient = internal_getDbClient();

  beforeAll(() => {
    suppressConsoleLogs();
  });

  let subjectQuery: QueryTableResult;
  // Start every test by navigating to the customize query workflow
  beforeEach(async () => {
    subjectQuery = await createTestCancerQuery();
  });

  afterEach(async () => {
    await deleteQueryByIdHelp(subjectQuery.queryId, dbClient);
  });

  it("applies time filters to queries", async () => {
    const patientRecordsRequest: PatientRecordsRequest = {
      patientId: HYPER_UNLUCKY_DEFAULT_ID,
      fhirServer: "Aidbox",
      queryName: subjectQuery.queryName,
    };
    const response = await patientRecordsQuery(patientRecordsRequest);
    // there should be three resources in the default query: 1 condition, 2 meds
    expect(Object.keys(response).length).toBe(3);

    const expectedConditionResponse = response["Condition"];
    const startFilter = new Date("2025-12-01");
    const endFilter = new Date("2025-12-05");

    // filter out med responses
    await updateTimeboxSettings(
      subjectQuery.queryId,
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
