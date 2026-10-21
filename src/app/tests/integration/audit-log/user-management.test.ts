import { getAuditEntry, TEST_USER } from "./utils";
import { auth } from "@/auth";
import {
  addQueriesToGroup,
  addUsersToGroup,
  createUserGroup,
  deleteUserGroup,
  removeUsersFromGroup,
  updateUserGroup,
} from "@/app/backend/usergroup-management";
import dbService from "@/app/backend/db/service";
import {
  addUserIfNotExists,
  updateUserDetails,
  updateUserRole,
} from "@/app/backend/user-management";
import { UserRole } from "@/app/models/entities/users";
import { randomUUID } from "crypto";
import { getQueryList } from "@/app/backend/query-building/service";
import { suppressConsoleLogs } from "../fixtures";

(auth as jest.Mock).mockResolvedValue(TEST_USER);
jest.mock("@/app/backend/db/decorators/auth");

describe("user management tests", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });
  beforeEach(async () => {
    await dbService.query("TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE");
  });

  it("user group creation, update, deletion", async () => {
    const actionTypeToCheck = "createUserGroup";
    const TEST_GROUP_NAME = "Koopalings" + Math.random() * 1000;

    const { items } = await createUserGroup(TEST_GROUP_NAME);

    const auditEntry = await getAuditEntry(actionTypeToCheck);
    const auditValues = auditEntry?.auditMessage;
    expect(JSON.parse(auditValues.groupName)).toBe(TEST_GROUP_NAME);

    const NEW_GROUP_NAME = "Koopa Troopas";
    await updateUserGroup(items[0].id, NEW_GROUP_NAME);
    const updateGroupAction = "updateUserGroup";

    const updateEntry = await getAuditEntry(updateGroupAction);
    const updateAuditValues = updateEntry?.auditMessage;

    expect(JSON.parse(updateAuditValues?.id)).toBe(items[0].id);
    expect(JSON.parse(updateAuditValues?.newName)).toBe(NEW_GROUP_NAME);

    await deleteUserGroup(items[0].id);
    const deletionAction = "deleteUserGroup";

    const deleteEntry = await getAuditEntry(deletionAction);
    const deleteAuditValues = deleteEntry?.auditMessage;

    expect(JSON.parse(deleteAuditValues?.id)).toBe(items[0].id);
  });
  it("user addition and detail and role update", async () => {
    const randomUsername = TEST_USER.user.username + Math.random() * 1000;
    const randomUserToken = {
      id: TEST_USER.user.id,
      username: randomUsername,
      email: TEST_USER.user.id,
      firstName: TEST_USER.user.id,
      lastName: TEST_USER.user.id,
      qcRole: UserRole.STANDARD,
    };
    const actionTypeToCheck = "addUserIfNotExists";
    const { user } = await addUserIfNotExists(randomUserToken);

    const auditEntry = await getAuditEntry(actionTypeToCheck);
    const auditValues = auditEntry?.auditMessage;

    expect(JSON.parse(auditValues?.userToken)).toStrictEqual(randomUserToken);
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

    const updateUserDetailsEntry = await getAuditEntry(updateActionType);
    const updateAuditValues = updateUserDetailsEntry?.auditMessage;

    expect(JSON.parse(updateAuditValues?.userId)).toStrictEqual(
      CREATED_USER_ID,
    );
    expect(JSON.parse(updateAuditValues?.updatedUserName)).toStrictEqual(
      UPDATED_USER_NAME,
    );
    expect(JSON.parse(updateAuditValues?.updatedRole)).toStrictEqual(
      UserRole.SUPER_ADMIN,
    );

    await updateUserRole(CREATED_USER_ID, UserRole.STANDARD);
    const updateRoleActionType = "updateUserRole";
    const updateUserRoleEntry = await getAuditEntry(updateRoleActionType);
    const updateUserValues = updateUserRoleEntry?.auditMessage;

    expect(JSON.parse(updateUserValues?.userId)).toStrictEqual(CREATED_USER_ID);
    expect(JSON.parse(updateUserValues?.newRole)).toStrictEqual(
      UserRole.STANDARD,
    );

    await dbService.query("DELETE FROM users WHERE id=$1", [user.id]);
  });
  it("user group user addition and removal", async () => {
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
      qcRole: UserRole.STANDARD,
    };

    const { user } = await addUserIfNotExists(randomUserToken);
    await addUsersToGroup(CREATED_GROUP_ID, [user.id]);
    const additionActionType = "addUsersToGroup";

    const additionAuditEntry = await getAuditEntry(additionActionType);
    const additionAuditValues = additionAuditEntry?.auditMessage;
    expect(JSON.parse(additionAuditValues?.groupId)).toStrictEqual(
      CREATED_GROUP_ID,
    );
    expect(JSON.parse(additionAuditValues?.userIds)).toStrictEqual([user.id]);

    await removeUsersFromGroup(CREATED_GROUP_ID, [user.id]);
    const deleteActionType = "removeUsersFromGroup";
    const deletionAuditEntry = await getAuditEntry(deleteActionType);

    const deleteAuditValues = deletionAuditEntry?.auditMessage;
    expect(JSON.parse(deleteAuditValues?.groupId)).toStrictEqual(
      CREATED_GROUP_ID,
    );
    expect(JSON.parse(deleteAuditValues?.userIds)).toStrictEqual([user.id]);

    await deleteUserGroup(CREATED_GROUP_ID);
    await dbService.query("DELETE FROM users WHERE id=$1", [user.id]);
  });
  it("user group query addition and removal", async () => {
    const TEST_GROUP_NAME = "Koopalings" + Math.random() * 1000;

    const { items } = await createUserGroup(TEST_GROUP_NAME);
    const CREATED_GROUP_ID = items[0].id;

    const queries = await getQueryList();
    const queryIds = queries.map((q) => q.queryId);
    const actionTypeToCheck = "addQueriesToGroup";
    await addQueriesToGroup(CREATED_GROUP_ID, queryIds);
    const auditEntry = await getAuditEntry(actionTypeToCheck);
    const auditAuditValues = auditEntry?.auditMessage;

    expect(JSON.parse(auditAuditValues?.groupId)).toStrictEqual(
      CREATED_GROUP_ID,
    );
    expect(JSON.parse(auditAuditValues?.queryIds)).toStrictEqual(queryIds);

    await removeUsersFromGroup(CREATED_GROUP_ID, queryIds);
    const removeUsersAction = await getAuditEntry(actionTypeToCheck);
    const removeAuditValues = removeUsersAction?.auditMessage;

    expect(JSON.parse(removeAuditValues?.groupId)).toStrictEqual(
      CREATED_GROUP_ID,
    );
    expect(JSON.parse(removeAuditValues?.queryIds)).toStrictEqual(queryIds);
  });
});
