"use server";
import { UserGroupMembership } from "../models/entities/user-management";
import { adminAccessCheck } from "../utils/auth";
import { getDbClient } from "./dbClient";
const dbClient = getDbClient();

/**
 * Retrieves the user group membership for a specific user group.
 * @param groupId - The unique identifier of the user group.
 * @returns A list of user group memberships for the specified group.
 */
export async function getUsersWithGroupStatus(
  groupId: string,
): Promise<UserGroupMembership[]> {
  if (!(await adminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  const groupCheckQuery = `SELECT id FROM usergroup WHERE id = $1;`;
  const groupCheckResult = await dbClient.query(groupCheckQuery, [groupId]);
  if (groupCheckResult.rows.length === 0) {
    return [];
  }

  const query = `
    SELECT u.id, u.username, u.first_name, u.last_name, u.qc_role,
           COALESCE(ug.id, '') AS membership_id,
           CASE 
             WHEN ug.user_id IS NOT NULL THEN TRUE
             ELSE FALSE
           END AS is_member
    FROM users u
    LEFT JOIN usergroup_to_users ug 
      ON u.id = ug.user_id AND ug.usergroup_id = $1
    ORDER BY u.last_name, u.first_name;
  `;

  const result = await dbClient.query(query, [groupId]);

  return result.rows.map((row) => ({
    id: row.membership_id,
    user: {
      id: row.id,
      username: row.username,
      first_name: row.first_name,
      last_name: row.last_name,
      qc_role: row.qc_role,
    },
    usergroup_id: groupId,
    is_member: row.is_member,
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
  if (!userIds.length) return [];

  const existingUsersQuery = `SELECT id FROM users WHERE id = ANY($1);`;
  const existingUsersResult = await dbClient.query(existingUsersQuery, [
    userIds,
  ]);
  const existingUserIds = new Set(
    existingUsersResult.rows.map((row) => row.id),
  );
  const validUserIds = userIds.filter((id) => existingUserIds.has(id));

  // If no valid user IDs are found, return an empty array
  if (!validUserIds.length) {
    return [];
  }

  const values = validUserIds
    .map((userId) => `('${userId}_${groupId}', '${userId}', '${groupId}')`)
    .join(",");
  const query = `
    INSERT INTO usergroup_to_users (id, user_id, usergroup_id)
    VALUES ${values}
    ON CONFLICT DO NOTHING
    RETURNING user_id;
  `;
  const result = await dbClient.query(query);
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
  if (!userIds.length) return [];
  const query = `
    DELETE FROM usergroup_to_users 
    WHERE usergroup_id = $1 AND user_id = ANY($2)
    RETURNING user_id;
  `;
  const result = await dbClient.query(query, [groupId, userIds]);
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
): Promise<UserGroupMembership[]> {
  if (!(await adminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  await dbClient.query("BEGIN");

  try {
    // Fetch current memberships
    const existingMemberships = await getUsersWithGroupStatus(groupId);
    const existingUserIds = new Set(
      existingMemberships.filter((m) => m.is_member).map((m) => m.user.id),
    );

    // Determine users to add and remove
    const usersToAdd = selectedUsers.filter((id) => !existingUserIds.has(id));
    const usersToRemove = existingMemberships
      .filter((m) => m.is_member && !selectedUsers.includes(m.user.id))
      .map((m) => m.user.id);

    // Update group membership
    if (usersToRemove.length)
      await removeUsersFromGroup(groupId, usersToRemove);
    if (usersToAdd.length) await addUsersToGroup(groupId, usersToAdd);

    // Fetch updated memberships
    const updatedMemberships = await getUsersWithGroupStatus(groupId);
    await dbClient.query("COMMIT");
    return updatedMemberships;
  } catch (error) {
    await dbClient.query("ROLLBACK");
    throw error;
  }
}
