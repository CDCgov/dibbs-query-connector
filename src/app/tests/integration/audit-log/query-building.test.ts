import dbService from "@/app/backend/db/service";
import { getAuditEntry, TEST_USER } from "./utils"; // Make sure to remove oldAuditIds from this utility!
import QueryBuildingService from "@/app/backend/query-building/service";
import {
  EMPTY_MEDICAL_RECORD_SECTIONS,
  NestedQuery,
  QueryUpdateResult,
} from "@/app/(pages)/queryBuilding/utils";
import { CANCER_FRONTEND_NESTED_INPUT } from "../../../../../e2e/constants";
import { randomUUID } from "crypto";
import { suppressConsoleLogs } from "../fixtures";
import { auth } from "@/auth";

jest.mock("@/app/backend/db/decorators");
(auth as jest.Mock).mockResolvedValue(TEST_USER);

describe("query building auditable integrations", () => {
  beforeAll(() => {
    // Suppress logs if needed
    // suppressConsoleLogs()
  });

  beforeEach(async () => {
    await dbService.query("TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE");
  });

  it("should generate an audit entry when saving a custom query", async () => {
    const queryInputFixture = CANCER_FRONTEND_NESTED_INPUT as NestedQuery;
    const randomName = "Cancer query " + Math.random() * 100;
    const author = "Test Steward";
    const queryId = randomUUID();

    await QueryBuildingService.saveCustomQuery(
      queryInputFixture,
      EMPTY_MEDICAL_RECORD_SECTIONS,
      randomName,
      author,
      queryId,
    );

    const auditEntry = await getAuditEntry("saveCustomQuery");
    const auditValues = auditEntry?.auditMessage;

    expect(JSON.parse(auditValues.queryInput)).toStrictEqual(
      CANCER_FRONTEND_NESTED_INPUT,
    );
    expect(JSON.parse(auditValues.queryName)).toStrictEqual(randomName);
    expect(JSON.parse(auditValues.queryId)).toStrictEqual(queryId);
  }, 10000);

  it("should generate an audit entry when deleting a query", async () => {
    const queryId = randomUUID();
    const queryCreated = await QueryBuildingService.saveCustomQuery(
      CANCER_FRONTEND_NESTED_INPUT as NestedQuery,
      EMPTY_MEDICAL_RECORD_SECTIONS,
      "Delete Test Query",
      "Test Steward",
      queryId,
    );

    expect(queryCreated).toBeDefined();

    const createdQueryId = (queryCreated as QueryUpdateResult[])[0].id;

    await QueryBuildingService.deleteQueryById(createdQueryId);

    const deletionAuditEvent = await getAuditEntry("deleteQueryById");
    const deleteAuditValues = deletionAuditEvent?.auditMessage;

    expect(JSON.parse(deleteAuditValues?.queryId)).toStrictEqual(
      createdQueryId,
    );
  }, 10000);
});
