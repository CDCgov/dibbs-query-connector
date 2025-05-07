import { auth } from "@/auth";
import { suppressConsoleLogs } from "../fixtures";
import dbService from "@/app/backend/db/service";

import * as AuditableDecorators from "@/app/backend/audit-logs/lib";
import {
  GET_ALL_AUDIT_ROWS,
  getAuditEntry,
  TEST_USER,
  waitForAuditSuccess,
} from "./utils";
import {
  deleteQueryById,
  saveCustomQuery,
} from "@/app/backend/query-building/service";
import {
  NestedQuery,
  QueryUpdateResult,
} from "@/app/(pages)/queryBuilding/utils";
import { CANCER_FRONTEND_NESTED_INPUT } from "../../../../../e2e/constants";

jest.mock("@/app/utils/auth", () => {
  return {
    superAdminAccessCheck: jest.fn(() => Promise.resolve(true)),
    adminAccessCheck: jest.fn(() => Promise.resolve(true)),
  };
});

jest.mock("@/app/backend/audit-logs/lib", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@/app/backend/audit-logs/lib"),
  };
});

const auditCompletionSpy = jest.spyOn(
  AuditableDecorators,
  "generateAuditSuccessMessage",
);

(auth as jest.Mock).mockResolvedValue(TEST_USER);

describe("query building", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });

  it("save and delete queries generates audit entries", async () => {
    const oldAuditIds = (await dbService.query(GET_ALL_AUDIT_ROWS)).rows.map(
      (r) => r.id,
    );
    const actionTypeToCheck = "saveCustomQuery";
    const queryInputFixture = CANCER_FRONTEND_NESTED_INPUT as NestedQuery;
    const randomName = "Cancer query " + Math.random() * 100;
    const author = "Test Steward";
    const queryCreated = await saveCustomQuery(
      queryInputFixture,
      randomName,
      author,
    );

    await waitForAuditSuccess(actionTypeToCheck, auditCompletionSpy);
    const auditEntry = await getAuditEntry(actionTypeToCheck, oldAuditIds);
    expect(JSON.parse(auditEntry?.queryInput)).toStrictEqual(
      CANCER_FRONTEND_NESTED_INPUT,
    );
    expect(JSON.parse(auditEntry?.queryName)).toStrictEqual(randomName);
    expect(JSON.parse(auditEntry?.author)).toStrictEqual(author);

    const deletionAuditType = "deleteQueryById";
    const createdQueryId = (queryCreated as QueryUpdateResult[])[0].id;
    await deleteQueryById(createdQueryId);

    await waitForAuditSuccess(actionTypeToCheck, auditCompletionSpy);
    const deletionAuditEvent = await getAuditEntry(
      deletionAuditType,
      oldAuditIds,
    );
    expect(JSON.parse(deletionAuditEvent?.queryId)).toStrictEqual(
      createdQueryId,
    );
  });
});
