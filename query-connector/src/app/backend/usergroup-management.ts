"use server";
import { User } from "../models/entities/user-management";
import { superAdminAccessCheck } from "../utils/auth";
import { getDbClient } from "./dbClient";
const dbClient = getDbClient();

/**
 * Retrieves the user group membership for a specific user group.
 * @param groupId - The unique identifier of the user group.
 * @returns A list of user group memberships for the specified group.
 */
export async function getUsersWithGroupStatus(
  groupId: string,
): Promise<User[]> {
  if (!(await superAdminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  const groupCheckQuery = {
    text: `SELECT id FROM usergroup WHERE id = $1;`,
    values: [groupId],
  };
  const groupCheckResult = await dbClient.query(groupCheckQuery);
  if (groupCheckResult.rows.length === 0) {
    return [];
  }

  const query = {
    text: `
      SELECT u.id, u.username, u.first_name, u.last_name, u.qc_role, g.name AS group_name,
             COALESCE(ug.id, '') AS membership_id,
             CASE 
               WHEN ug.user_id IS NOT NULL THEN TRUE
               ELSE FALSE
             END AS is_member
      FROM users u
      LEFT JOIN usergroup_to_users ug 
        ON u.id = ug.user_id AND ug.usergroup_id = $1
      LEFT JOIN usergroup g 
        ON ug.usergroup_id = g.id
      ORDER BY u.last_name, u.first_name;
    `,
    values: [groupId],
  };

  const result = await dbClient.query(query);

  return result.rows.map((row) => ({
    id: row.id,
    username: row.username,
    first_name: row.first_name,
    last_name: row.last_name,
    qc_role: row.qc_role,
    userGroupMemberships: [
      {
        id: row.membership_id,
        usergroup_id: groupId,
        group_name: row.group_name,
        is_member: row.is_member,
      },
    ],
  }));
}

/**
 * Adds users to a user group.
 * @param groupId - The unique identifier of the user group.
 * @param userIds - The unique identifiers of the users to add.
 * @returns The user IDs of the users added to the group.
 */
export async function addUsersToGroup(
  groupId: string,
  userIds: string[],
): Promise<string[]> {
  if (userIds.length === 0) return [];

  const ids = userIds.map((userId) => `${userId}_${groupId}`);
  const insertQuery = {
    text: `
      INSERT INTO usergroup_to_users (id, user_id, usergroup_id)
      SELECT * FROM unnest($1::text[], $2::uuid[], $3::uuid[])
      ON CONFLICT DO NOTHING
      RETURNING user_id;
    `,
    values: [ids, userIds, new Array(userIds.length).fill(groupId)],
  };

  const result = await dbClient.query(insertQuery);
  return result.rows.map((row) => row.user_id);
}

/**
 * Removes users from a user group.
 * @param groupId - The unique identifier of the user group.
 * @param userIds - The unique identifiers of the users to remove.
 * @returns The user IDs of the users removed from the group.
 */
export async function removeUsersFromGroup(
  groupId: string,
  userIds: string[],
): Promise<string[]> {
  if (userIds.length === 0) return [];

  const query = {
    text: `
      DELETE FROM usergroup_to_users 
      WHERE usergroup_id = $1 AND user_id = ANY($2)
      RETURNING user_id;
    `,
    values: [groupId, userIds],
  };

  const result = await dbClient.query(query);
  return result.rows.map((row) => row.user_id);
}

/**
 * Saves the user group membership for a specific user group.
 * @param groupId - The unique identifier of the user group.
 * @param selectedUsers - The unique identifiers of the users to add to the group.
 * @returns A list of user group memberships for the specified group.
 */
export async function saveUserGroupMembership(
  groupId: string,
  selectedUsers: string[],
): Promise<User[]> {
  if (!(await superAdminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  await dbClient.query("BEGIN");

  try {
    const existingMemberships = await getUsersWithGroupStatus(groupId);
    const existingUserIds = new Set(
      existingMemberships.flatMap(
        (user) =>
          user.userGroupMemberships
            ?.filter((m) => m.is_member)
            .map((m) => user.id) || [],
      ),
    );

    const usersToAdd = selectedUsers.filter((id) => !existingUserIds.has(id));
    const usersToRemove = existingMemberships.flatMap(
      (user) =>
        user.userGroupMemberships
          ?.filter((m) => m.is_member && !selectedUsers.includes(user.id))
          .map((m) => user.id) || [],
    );

    if (usersToRemove.length)
      await removeUsersFromGroup(groupId, usersToRemove);
    if (usersToAdd.length) await addUsersToGroup(groupId, usersToAdd);

    const updatedUsers = await getUsersWithGroupStatus(groupId);
    await dbClient.query("COMMIT");
    return updatedUsers;
  } catch (error) {
    await dbClient.query("ROLLBACK");
    throw error;
  }
}
