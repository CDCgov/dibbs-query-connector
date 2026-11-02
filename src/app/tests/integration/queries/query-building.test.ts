jest.mock("@/app/backend/db/decorators/auth");
jest.mock("@/app/backend/db/decorators/util");
jest.mock("@/app/backend/audit-logs/decorator");

import {
  deleteQueryById,
  getCustomQueries,
  getSavedQueryById,
} from "@/app/backend/query-building/service";
import { createTestCancerQuery } from "../../../../../e2e/utils";
import { suppressConsoleLogs } from "../fixtures";
import { resetMocksToDefault } from "../mocks";

describe("Saving a custom query", () => {
  beforeEach(() => {
    resetMocksToDefault();
    suppressConsoleLogs();
  });

  it("saving a custom query", async () => {
    const testQuery = await createTestCancerQuery();
    expect(Object.keys(testQuery.queryData)).toStrictEqual(["2"]);
    expect(testQuery.conditionsList).toStrictEqual(["2"]);
  });

  it("deletes a query correctly", async () => {
    const testQuery = await createTestCancerQuery();
    const result = await deleteQueryById(testQuery.queryId);
    expect(result.success).toBe(true);

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
    expect(diffId.map((q) => q.queryId).includes(testQuery.queryId)).toBe(true);
  });
});
