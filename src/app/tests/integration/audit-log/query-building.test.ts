jest.mock("@/app/backend/db/decorators/auth");
jest.mock("@/app/backend/db/decorators/util");
(auth as jest.Mock).mockResolvedValue(TEST_USER);

import { getAuditEntry, TEST_USER } from "./utils"; // Make sure to remove oldAuditIds from this utility!
import {
  EMPTY_MEDICAL_RECORD_SECTIONS,
  NestedQuery,
  QueryUpdateResult,
} from "@/app/(pages)/queryBuilding/utils";
import { CANCER_FRONTEND_NESTED_INPUT } from "../../../../../e2e/constants";
import { randomUUID } from "crypto";
import { suppressConsoleLogs } from "../fixtures";
import { auth } from "@/auth";
import {
  deleteQueryById,
  saveCustomQuery,
} from "@/app/backend/query-building/service";

describe("query building auditable integrations", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });

  it("should generate an audit entry when saving a custom query", async () => {
    const queryInputFixture = CANCER_FRONTEND_NESTED_INPUT as NestedQuery;
    const randomName = "Cancer query " + Math.random() * 100;
    const author = "Test Steward";
    const queryId = randomUUID();

    await saveCustomQuery(
      queryInputFixture,
      EMPTY_MEDICAL_RECORD_SECTIONS,
      randomName,
      author,
      queryId,
    );

    const auditEntry = await getAuditEntry("saveCustomQuery");

    expect(JSON.parse(auditEntry.queryInput)).toStrictEqual(
      CANCER_FRONTEND_NESTED_INPUT,
    );
    expect(JSON.parse(auditEntry.queryName)).toStrictEqual(randomName);
    expect(JSON.parse(auditEntry.queryId)).toStrictEqual(queryId);
  }, 10000);

  it("should generate an audit entry when deleting a query", async () => {
    const queryId = randomUUID();
    const queryCreated = await saveCustomQuery(
      CANCER_FRONTEND_NESTED_INPUT as NestedQuery,
      EMPTY_MEDICAL_RECORD_SECTIONS,
      "Delete Test Query",
      "Test Steward",
      queryId,
    );

    expect(queryCreated).toBeDefined();

    const createdQueryId = (queryCreated as QueryUpdateResult[])[0].id;
    await deleteQueryById(createdQueryId);

    const deletionAuditEvent = await getAuditEntry("deleteQueryById");
    expect(JSON.parse(deletionAuditEvent?.queryId)).toStrictEqual(
      createdQueryId,
    );
  }, 10000);
});
