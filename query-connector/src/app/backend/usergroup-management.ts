"use server";
import { User, UserGroup } from "../models/entities/users";
import {
  getAllUsersWithSingleGroupStatus,
  checkUserExists,
  getSingleUserWithGroupMemberships,
} from "./user-management";

import { adminAccessCheck, superAdminAccessCheck } from "../utils/auth";
import { getDbClient } from "./dbClient";
import { QCResponse } from "../models/responses/collections";
import { QueryTableResult } from "../(pages)/queryBuilding/utils";

const dbClient = getDbClient();

/**
 * Creates a new user group if it does not already exist.
 * @param groupName - The name of the user group to create.
 * @returns The created user group or an error message if it already exists.
 */
export async function createUserGroup(
  groupName: string,
): Promise<UserGroup | string> {
  if (!(await superAdminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  try {
    // Check if the group name already exists
    const existingGroups = await getAllUserGroups();
    const groupExists =
      existingGroups.items?.some((group) => group.name === groupName) ?? false;

    if (groupExists) {
      console.warn(`Group with name '${groupName}' already exists.`);
      return `Group '${groupName}' already exists.`;
    }

    const createGroupQuery = `
      INSERT INTO usergroup (name)
      VALUES ($1)
      RETURNING id, name;
    `;

    const result = await dbClient.query(createGroupQuery, [groupName]);

    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      member_size: 0,
      query_size: 0,
    };
  } catch (error) {
    console.error("Error creating user group:", error);
    throw error;
  }
}

/**
 * Updates the name of an existing user group.
 * @param id - The unique identifier of the user group to update.
 * @param newName - The new name to assign to the user group.
 * @param userIds - The new name to assign to the user group.
//  * @param queryIds - The new name to assign to the user group.
 * @returns The updated user group or an error if the update fails.
 */
export async function updateUserGroup(
  id: string,
  newName: string,
  userIds?: string[],
  // queryIds?: string[],
): Promise<UserGroup | string> {
  if (!(await superAdminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  try {
    // Check if the new name already exists
    const existingGroups = await getAllUserGroups();
    const groupExists =
      existingGroups.items?.some((group) => group.name === newName) ?? false;

    if (groupExists) {
      console.warn(`Group with name '${newName}' already exists.`);
      return `Group '${newName}' already exists.`;
    }

    const updateUserGroupMembersQuery = `
      UPDATE usergroup
      SET name = $1
      WHERE id = $2
      RETURNING id, name;
    `;
    const escapedValues =
      userIds && userIds.map((_, i) => `$${i + 1}`).join() + ")";
    const queryString = updateUserGroupMembersQuery + escapedValues;

    const result = await dbClient.query(queryString, [newName, id, userIds]);

    if (result.rows.length === 0) {
      throw new Error(`User group with ID '${id}' not found.`);
    }

    // Get updated memberSize and querySize from getUserGroup
    const userGroups = await getAllUserGroups();
    const updatedGroup =
      userGroups?.items?.find((group) => group.id === id) ?? null;

    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      member_size: updatedGroup?.member_size ?? 0,
      query_size: updatedGroup?.query_size ?? 0,
    };
  } catch (error) {
    console.error("Error updating user group:", error);
    throw error;
  }
}

/**
 * Deletes a user group by its unique identifier.
 * @param id - The unique identifier of the user group to delete.
 * @returns The deleted user group or an error if the deletion fails.
 */
export async function deleteUserGroup(id: string): Promise<UserGroup | string> {
  if (!(await superAdminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  try {
    await dbClient.query(
      "DELETE FROM usergroup_to_users WHERE usergroup_id = $1",
      [id],
    );
    await dbClient.query(
      "DELETE FROM usergroup_to_query WHERE usergroup_id = $1",
      [id],
    );
    const deleteGroupQuery = `
      DELETE FROM usergroup
      WHERE id = $1
      RETURNING id, name;
    `;

    const result = await dbClient.query(deleteGroupQuery, [id]);

    if (result.rows.length === 0) {
      throw new Error(`User group with ID '${id}' not found.`);
    }

    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      member_size: 0,
      query_size: 0,
    };
  } catch (error) {
    console.error("Error deleting user group:", error);
    throw error;
  }
}

/**
 * Adds users to a user group.
 * @param groupId - The unique identifier of the user group.
 * @param userId - The unique identifiers of the users to add.
 * @returns The user IDs of the users added to the group.
 */
export async function addSingleUserToGroup(
  groupId: string,
  userId: string,
): Promise<QCResponse<User>> {
  const userCheckResult = await checkUserExists(userId);
  if (!userCheckResult) {
    return { items: [], totalItems: 0 };
  }

  try {
    const idString = `${userId}_${groupId}`;
    const insertQuery = {
      text: `
          INSERT INTO usergroup_to_users (id, user_id, usergroup_id)
          VALUES ($1,$2,$3)
          ON CONFLICT DO NOTHING
          RETURNING user_id;
        `,
      values: [idString, userId, groupId],
    };

    const updatedUserId = await dbClient.query(insertQuery);
    const updatedUserWithGroups: QCResponse<User> =
      await getSingleUserWithGroupMemberships(updatedUserId.rows[0].user_id);
    return { totalItems: 1, items: updatedUserWithGroups.items };
  } catch (error) {
    console.error("Error adding user to group:", error);
    throw error;
  }
}

/**
 * Adds users to a user group.
 * @param groupId - The unique identifier of the user group.
 * @param userIds - The unique identifiers of the users to add.
 * @returns The user IDs of the users added to the group.
 */
export async function addMultipleUsersToGroup(
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
 * Adds users to a user group.
 * @param groupId - The unique identifier of the user group.
 * @param userId - The unique identifiers of the users to add.
 * @returns The user IDs of the users added to the group.
 */
export async function removeSingleUserFromGroup(
  groupId: string,
  userId: string,
): Promise<QCResponse<User>> {
  if (!userId) return { items: [], totalItems: 0 };

  const userCheckQuery = {
    text: `SELECT * FROM users WHERE id = $1;`,
    values: [userId],
  };
  const userCheckResult = await dbClient.query(userCheckQuery);
  if (userCheckResult.rows.length === 0) {
    return { items: [], totalItems: 0 };
  }

  try {
    const removeUserQuery = {
      text: `
      DELETE FROM usergroup_to_users 
      WHERE usergroup_id = $1 AND user_id = $2
      RETURNING user_id;
    `,
      values: [groupId, userId],
    };

    const updatedUserId = await dbClient.query(removeUserQuery);
    const updatedUserWithGroups: QCResponse<User> =
      await getSingleUserWithGroupMemberships(updatedUserId.rows[0].user_id);
    return { totalItems: 1, items: updatedUserWithGroups.items };
  } catch (error) {
    console.error("Error removing user from group:", error);
    throw error;
  }
}

/**
 * Removes users from a user group.
 * @param groupId - The unique identifier of the user group.
 * @param userIds - The unique identifiers of the users to remove.
 * @returns The user IDs of the users removed from the group.
 */
export async function removeMultipleUsersFromGroup(
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
    const existingMemberships = await getAllUsersWithSingleGroupStatus(groupId);
    const existingUserIds = new Set(
      existingMemberships.flatMap(
        (user) =>
          user.userGroupMemberships
            ?.filter((m) => m.is_member)
            .map(() => user.id) || [],
      ),
    );

    const usersToAdd = selectedUsers.filter((id) => !existingUserIds.has(id));
    const usersToRemove = existingMemberships.flatMap(
      (user) =>
        user.userGroupMemberships
          ?.filter((m) => m.is_member && !selectedUsers.includes(user.id))
          .map(() => user.id) || [],
    );

    if (usersToRemove.length)
      await removeMultipleUsersFromGroup(groupId, usersToRemove);
    if (usersToAdd.length) await addMultipleUsersToGroup(groupId, usersToAdd);

    const updatedUsers = await getAllUsersWithSingleGroupStatus(groupId);
    await dbClient.query("COMMIT");
    return updatedUsers;
  } catch (error) {
    await dbClient.query("ROLLBACK");
    throw error;
  }
}

/**
 * Retrieves all registered user groups in Query Connector along with member and query counts.
 * @returns A list of user groups registered in the query connector.
 */
export async function getAllUserGroups(): Promise<QCResponse<UserGroup>> {
  if (!(await adminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  try {
    const selectAllUserGroupQuery = `
      SELECT 
        ug.id, 
        ug.name, 
        COALESCE(member_count, 0) AS member_size,
        COALESCE(query_count, 0) AS query_size
      FROM usergroup ug
      LEFT JOIN (
        SELECT usergroup_id, COUNT(*) AS member_count 
        FROM usergroup_to_users 
        GROUP BY usergroup_id
      ) uu ON ug.id = uu.usergroup_id
      LEFT JOIN (
        SELECT usergroup_id, COUNT(*) AS query_count 
        FROM usergroup_to_query 
        GROUP BY usergroup_id
      ) uq ON ug.id = uq.usergroup_id
      ORDER BY ug.name ASC;
    `;

    const result = await dbClient.query(selectAllUserGroupQuery);

    return {
      totalItems: result.rowCount,
      items: result.rows,
    } as QCResponse<UserGroup>;
  } catch (error) {
    console.error("Error retrieving user groups:", error);
    throw error;
  }
}

/**
 * Retrieves a single user group
 * @param id The unique identifier of the UserGroup
 * @returns A UserGroup object with the given id
 */
export async function getUserGroupById(id: string): Promise<UserGroup> {
  if (!(await adminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  try {
    const selectAllUserGroupQuery = `
      SELECT id, name 
      FROM usergroup 
      WHERE id = $1 
    `;

    const result = await dbClient.query(selectAllUserGroupQuery, [id]);

    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      member_size: result.rows[0].member_size,
      query_size: result.rows[0].query_size,
    };
  } catch (error) {
    console.error("Error retrieving user group:", error);
    throw error;
  }
}

/**
 * Retrieves the list of Users for a given user group
 * @param groupId identifier of the group whose members we are retrieving
 * @returns A list of Users for the given group
 */
export async function getAllGroupMembers(
  groupId: string,
): Promise<QCResponse<User>> {
  try {
    const selectMembersByGroupQuery = `
    SELECT u.id, u.first_name, u.last_name, u.username, u.qc_role
    FROM users as u
    LEFT JOIN usergroup_to_users as ugtu ON ugtu.user_id = u.id
    WHERE ugtu.usergroup_id = $1;
    `;

    const result = await dbClient.query(selectMembersByGroupQuery, [groupId]);
    return {
      totalItems: result.rowCount,
      items: result.rows || [],
    } as QCResponse<User>;
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves the queries for a given group
 * @param groupId identifier of the group whose queries we are retrieving
 * @returns A list of Query data for the given group
 */
export async function getAllGroupQueries(
  groupId: string,
): Promise<QCResponse<QueryTableResult>> {
  try {
    const selectQueriesByGroupQuery = `
    SELECT q.id as query_id, q.query_name, q.query_data, q.conditions_list, q.author, q.date_created, q.date_last_modified
    FROM query as q
    LEFT JOIN usergroup_to_query as ugtq ON ugtq.query_id = q.id
    WHERE ugtq.usergroup_id = $1;
    `;
    const result = await dbClient.query(selectQueriesByGroupQuery, [groupId]);
    return {
      totalItems: result.rowCount,
      items: result.rows || [],
    } as QCResponse<QueryTableResult>;
  } catch (error) {
    throw error;
  }
}
