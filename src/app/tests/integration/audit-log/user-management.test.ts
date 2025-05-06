import * as AuditableDecorators from "@/app/backend/auditLogs/lib";
import { TEST_USER } from "./utils";
import { auth } from "@/auth";
import { createUserGroup } from "@/app/backend/usergroup-management";

jest.mock("@/app/backend/auditLogs/lib", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@/app/backend/auditLogs/lib"),
  };
});
const auditCompletionSpy = jest.spyOn(
  AuditableDecorators,
  "generateAuditSuccessMessage",
);
(auth as jest.Mock).mockResolvedValue(TEST_USER);

describe("user management tests", () => {
  it("user group creation, update, deletion", async () => {
    await createUserGroup();
  });
  it("user addition and detail and role update", async () => {});
  it("user group user addition and removal", async () => {});
  it("user group query addition and removal", async () => {});
});
