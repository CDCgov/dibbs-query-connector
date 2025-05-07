import { GET_ALL_AUDIT_ROWS, getAuditEntry, TEST_USER } from "./utils";
import { auth } from "@/auth";
import {
  addQueriesToGroup,
  addUsersToGroup,
  createUserGroup,
  deleteUserGroup,
  removeUsersFromGroup,
  updateUserGroup,
} from "@/app/backend/usergroup-management";
import dbService from "@/app/backend/db/client";
import {
  addUserIfNotExists,
  updateUserDetails,
  updateUserRole,
} from "@/app/backend/user-management";
import { UserRole } from "@/app/models/entities/users";
import { randomUUID } from "crypto";
import { getQueryList } from "@/app/backend/query-building/service";
import { suppressConsoleLogs } from "../fixtures";

jest.mock("@/app/utils/auth", () => {
  return {
    superAdminAccessCheck: jest.fn(() => Promise.resolve(true)),
    adminAccessCheck: jest.fn(() => Promise.resolve(true)),
  };
});

jest.mock("@/app/backend/auditLogs/lib", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@/app/backend/auditLogs/lib"),
  };
});

(auth as jest.Mock).mockResolvedValue(TEST_USER);

describe("user management tests", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });
  it("user group creation, update, deletion", async () => {
    const oldAuditIds = (await dbService.query(GET_ALL_AUDIT_ROWS)).rows.map(
      (r) => r.id,
    );
    const actionTypeToCheck = "createUserGroup";
    const TEST_GROUP_NAME = "Koopalings" + Math.random() * 1000;

    const { items } = await createUserGroup(TEST_GROUP_NAME);
    const auditEntry = await getAuditEntry(actionTypeToCheck, oldAuditIds);
    expect(JSON.parse(auditEntry?.groupName)).toBe(TEST_GROUP_NAME);

    const NEW_GROUP_NAME = "Koopa Troopas";
    await updateUserGroup(items[0].id, NEW_GROUP_NAME);
    const updateGroupAction = "updateUserGroup";
    const updateEntry = await getAuditEntry(updateGroupAction, oldAuditIds);
    expect(JSON.parse(updateEntry?.id)).toBe(items[0].id);
    expect(JSON.parse(updateEntry?.newName)).toBe(NEW_GROUP_NAME);

    await deleteUserGroup(items[0].id);
    const deletionAction = "deleteUserGroup";
    const deleteEntry = await getAuditEntry(deletionAction, oldAuditIds);
    expect(JSON.parse(deleteEntry?.id)).toBe(items[0].id);
  });
  it("user addition and detail and role update", async () => {
    const oldAuditIds = (await dbService.query(GET_ALL_AUDIT_ROWS)).rows.map(
      (r) => r.id,
    );

    const randomUsername = TEST_USER.user.username + Math.random() * 1000;
    const randomUserToken = {
      id: TEST_USER.user.id,
      username: randomUsername,
      email: TEST_USER.user.id,
      firstName: TEST_USER.user.id,
      lastName: TEST_USER.user.id,
    };
    const actionTypeToCheck = "addUserIfNotExists";
    const { user } = await addUserIfNotExists(randomUserToken);
    const auditEntry = await getAuditEntry(actionTypeToCheck, oldAuditIds);
    expect(JSON.parse(auditEntry?.userToken)).toStrictEqual(randomUserToken);
    const CREATED_USER_ID = user.id;

    const updateActionType = "updateUserDetails";
    const UPDATED_USER_NAME = "Bowser Jr. III";
    await updateUserDetails(
      CREATED_USER_ID,
      UPDATED_USER_NAME,
      "Bowser",
      "Jr. III",
      UserRole.SUPER_ADMIN,
    );
    const updateUserDetailsEntry = await getAuditEntry(
      updateActionType,
      oldAuditIds,
    );
    expect(JSON.parse(updateUserDetailsEntry?.userId)).toStrictEqual(
      CREATED_USER_ID,
    );
    expect(JSON.parse(updateUserDetailsEntry?.updatedUserName)).toStrictEqual(
      UPDATED_USER_NAME,
    );
    expect(JSON.parse(updateUserDetailsEntry?.updatedRole)).toStrictEqual(
      UserRole.SUPER_ADMIN,
    );

    await updateUserRole(CREATED_USER_ID, UserRole.STANDARD);
    const updateRoleActionType = "updateUserRole";
    const updateUserRoleEntry = await getAuditEntry(
      updateRoleActionType,
      oldAuditIds,
    );
    expect(JSON.parse(updateUserRoleEntry?.userId)).toStrictEqual(
      CREATED_USER_ID,
    );
    expect(JSON.parse(updateUserRoleEntry?.newRole)).toStrictEqual(
      UserRole.STANDARD,
    );

    await dbService.query("DELETE FROM users WHERE id=$1", [user.id]);
  });
  it("user group user addition and removal", async () => {
    const oldAuditIds = (await dbService.query(GET_ALL_AUDIT_ROWS)).rows.map(
      (r) => r.id,
    );
    const TEST_GROUP_NAME = "Koopalings" + Math.random() * 1000;

    const { items } = await createUserGroup(TEST_GROUP_NAME);
    const CREATED_GROUP_ID = items[0].id;
    const randomUsername = TEST_USER.user.username + Math.random() * 1000;
    const randomId = randomUUID();
    const randomUserToken = {
      id: randomId,
      username: randomUsername,
      email: TEST_USER.user.id,
      firstName: TEST_USER.user.id,
      lastName: TEST_USER.user.id,
    };

    const { user } = await addUserIfNotExists(randomUserToken);
    await addUsersToGroup(CREATED_GROUP_ID, [user.id]);
    const additionActionType = "addUsersToGroup";
    const additionAuditEntry = await getAuditEntry(
      additionActionType,
      oldAuditIds,
    );
    expect(JSON.parse(additionAuditEntry?.groupId)).toStrictEqual(
      CREATED_GROUP_ID,
    );
    expect(JSON.parse(additionAuditEntry?.userIds)).toStrictEqual([user.id]);

    await removeUsersFromGroup(CREATED_GROUP_ID, [user.id]);
    const deleteActionType = "removeUsersFromGroup";
    const deletionAuditEntry = await getAuditEntry(
      deleteActionType,
      oldAuditIds,
    );
    expect(JSON.parse(deletionAuditEntry?.groupId)).toStrictEqual(
      CREATED_GROUP_ID,
    );
    expect(JSON.parse(deletionAuditEntry?.userIds)).toStrictEqual([user.id]);

    await deleteUserGroup(CREATED_GROUP_ID);
    await dbService.query("DELETE FROM users WHERE id=$1", [user.id]);
  });
  it("user group query addition and removal", async () => {
    const oldAuditIds = (await dbService.query(GET_ALL_AUDIT_ROWS)).rows.map(
      (r) => r.id,
    );
    const TEST_GROUP_NAME = "Koopalings" + Math.random() * 1000;

    const { items } = await createUserGroup(TEST_GROUP_NAME);
    const CREATED_GROUP_ID = items[0].id;

    const queries = await getQueryList();
    const queryIds = queries.map((q) => q.queryId);
    const actionTypeToCheck = "addQueriesToGroup";
    await addQueriesToGroup(CREATED_GROUP_ID, queryIds);
    const auditEntry = await getAuditEntry(actionTypeToCheck, oldAuditIds);
    expect(JSON.parse(auditEntry?.groupId)).toStrictEqual(CREATED_GROUP_ID);
    expect(JSON.parse(auditEntry?.queryIds)).toStrictEqual(queryIds);

    await removeUsersFromGroup(CREATED_GROUP_ID, queryIds);
    const removeUsersAction = await getAuditEntry(
      actionTypeToCheck,
      oldAuditIds,
    );
    expect(JSON.parse(removeUsersAction?.groupId)).toStrictEqual(
      CREATED_GROUP_ID,
    );
    expect(JSON.parse(removeUsersAction?.queryIds)).toStrictEqual(queryIds);
  });
});
