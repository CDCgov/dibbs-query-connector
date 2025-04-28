import { deleteQueryById } from "@/app/backend/query-building";
import { createTestCancerQuery } from "../../../../e2e/utils";
import { getSavedQueryById } from "@/app/backend/dbServices/query-building";
jest.mock("@/app/utils/auth", () => {
  return {
    superAdminAccessCheck: jest.fn().mockResolvedValue(true),
    adminAccessCheck: jest.fn().mockResolvedValue(true),
  };
});

describe("Saving a custom query", () => {
  it("saving a custom query", async () => {
    const testQuery = await createTestCancerQuery();
    expect(Object.keys(testQuery.queryData)).toStrictEqual(["2"]);
    expect(testQuery.conditionsList).toStrictEqual(["2"]);
  });

  it("deletes a query correctly", async () => {
    const testQuery = await createTestCancerQuery();
    await deleteQueryById(testQuery.queryId);

    const shouldReturnEmptyArray = await getSavedQueryById(testQuery.queryId);
    expect(shouldReturnEmptyArray).toStrictEqual([]);
  });
});
