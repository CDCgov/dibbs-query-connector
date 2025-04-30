import {
  deleteQueryById,
  getCustomQueries,
} from "@/app/backend/query-building";
import { createTestCancerQuery } from "../../../../e2e/utils";
import { getSavedQueryById } from "@/app/backend/dbServices/query-building";
import { suppressConsoleLogs } from "./fixtures";
jest.mock("@/app/utils/auth", () => {
  return {
    superAdminAccessCheck: jest.fn().mockResolvedValue(true),
    adminAccessCheck: jest.fn().mockResolvedValue(true),
  };
});

describe("Saving a custom query", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });
  it("saving a custom query", async () => {
    const testQuery = await createTestCancerQuery();
    expect(Object.keys(testQuery.queryData)).toStrictEqual(["2"]);
    expect(testQuery.conditionsList).toStrictEqual(["2"]);
  });

  it("deletes a query correctly", async () => {
    const testQuery = await createTestCancerQuery();
    await deleteQueryById(testQuery.queryId);

    const shouldReturnEmptyArray = await getSavedQueryById(testQuery.queryId);
    expect(shouldReturnEmptyArray).toStrictEqual(undefined);
  });

  it("get custom queries grabs a new query", async () => {
    const initialList = await getCustomQueries();
    const initialListIds = initialList.map((q) => q.queryId);

    // insert new query
    const testQuery = await createTestCancerQuery();

    // requerying the DB should give us the new query
    const followupList = await getCustomQueries();

    const diffId = followupList.filter((q) => {
      return !initialListIds.includes(q.queryId);
    });
    expect(diffId.length).toBe(1); // we've inserted one extra query, so followup and initial should differ by one query
    expect(diffId[0].queryId).toBe(testQuery.queryId);
  });
});
