"use server";
import { User, UserGroup, UserGroupMembership } from "../models/entities/users";
import {
  getAllUsersWithSingleGroupStatus,
  getSingleUserWithGroupMemberships,
} from "./user-management";

import { adminAccessCheck } from "../utils/auth";
import { getDbClient } from "./dbClient";
import { QCResponse } from "../models/responses/collections";
import { CustomUserQuery } from "../models/entities/query";
import { QueryResult } from "pg";
import { getQueryById } from "./query-building";

const dbClient = getDbClient();

/**
 * Creates a new user group if it does not already exist.
 * @param groupName - The name of the user group to create.
 * @returns The created user group or an error message if it already exists.
 */
export async function createUserGroup(
  groupName: string,
): Promise<QCResponse<UserGroup>> {
  // TODO: https://linear.app/skylight-cdc/issue/QUE-216/refactor-user-management-code-into-service-class-pattern
  if (!(await adminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  try {
    // Check if the group name already exists
    const existingGroups = await getAllUserGroups();
    const groupExists =
      existingGroups.items?.some((group) => group.name === groupName) ?? false;

    if (groupExists) {
      throw new Error(`User group '${groupName}' already exists.`);
    }

    const createGroupQuery = `
      INSERT INTO usergroup (name)
      VALUES ($1)
      RETURNING id, name;
    `;

    const result = await dbClient.query(createGroupQuery, [groupName]);

    const newUserGroup = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      member_size: 0,
      query_size: 0,
    };
    return { items: [newUserGroup], totalItems: 1 };
  } catch (error) {
    console.error("Error creating user group:", error);
    throw error;
  }
}

/**
 * Updates the name of an existing user group.
 * @param id - The unique identifier of the user group to update.
 * @param newName - The new name to assign to the user group.
 * @returns The updated user group or an error if the update fails.
 */
export async function updateUserGroup(
  id: string,
  newName: string,
): Promise<UserGroup | string> {
  // TODO: https://linear.app/skylight-cdc/issue/QUE-216/refactor-user-management-code-into-service-class-pattern
  if (!(await adminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  try {
    // Check if the new name already exists
    const existingGroups = await getAllUserGroups();
    const groupExists =
      existingGroups.items?.some((group) => {
        return group.name === newName;
      }) ?? false;

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

    const result = await dbClient.query(updateUserGroupMembersQuery, [
      newName,
      id,
    ]);

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
  // TODO: https://linear.app/skylight-cdc/issue/QUE-216/refactor-user-management-code-into-service-class-pattern
  if (!(await adminAccessCheck())) {
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
 * @param userIds - The unique identifier(s) of the users to add.
 * @returns The user IDs of the users added to the group.
 */
export async function addUsersToGroup(
  groupId: string,
  userIds: string[],
): Promise<QCResponse<User>> {
  if (!userIds || userIds.length <= 0 || !groupId)
    return { items: [], totalItems: 0 };
  try {
    const membershipIds = userIds.map((userId) => `${userId}_${groupId}`);
    const groupIds: string[] = new Array(userIds.length).fill(groupId);

    const insertQuery = {
      text: `
        INSERT INTO usergroup_to_users (id, user_id, usergroup_id)
        SELECT * FROM unnest($1::text[], $2::uuid[], $3::uuid[])
        ON CONFLICT DO NOTHING
        RETURNING user_id;
      `,
      values: [membershipIds, userIds, groupIds],
    };

    const result = await dbClient.query(insertQuery);

    const updatedUsers = await Promise.all(
      result.rows.map(async (updatedUser) => {
        const updatedUserWithGroups = await getSingleUserWithGroupMemberships(
          updatedUser.user_id,
        );
        await dbClient.query("COMMIT");

        return updatedUserWithGroups.items[0];
      }),
    );

    return { totalItems: result.rowCount || 0, items: updatedUsers };
  } catch (error) {
    console.error("Error adding user(s) to user group:", error);
    throw error;
  }
}

/**
 * Adds users to a user group.
 * @param groupId - The unique identifier of the user group.
 * @param userIds - The unique identifier(s) of the users to add.
 * @returns The user IDs of the users added to the group.
 */
export async function removeUsersFromGroup(
  groupId: string,
  userIds: string[],
): Promise<QCResponse<User>> {
  if (!userIds || !groupId) return { items: [], totalItems: 0 };

  try {
    const values = userIds.length > 1 ? `ANY($2)` : "$2";
    const insertQuery = {
      text: `
      DELETE FROM usergroup_to_users 
      WHERE usergroup_id = $1 AND user_id = ${values}
      RETURNING user_id;
    `,
      values: [groupId, userIds.length > 1 ? userIds : userIds[0]],
    };

    const result = await dbClient.query(insertQuery);
    const updatedUsers = await Promise.all(
      result.rows.map(async (updatedUser) => {
        const updatedUserWithGroups = await getSingleUserWithGroupMemberships(
          updatedUser.user_id,
        );
        await dbClient.query("COMMIT");

        return updatedUserWithGroups.items[0];
      }),
    );

    return { totalItems: result.rowCount || 0, items: updatedUsers };
  } catch (error) {
    console.error("Error removing user(s) from user group:", error);
    throw error;
  }
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
  // TODO: https://linear.app/skylight-cdc/issue/QUE-216/refactor-user-management-code-into-service-class-pattern
  if (!(await adminAccessCheck())) {
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

    if (usersToRemove.length > 0)
      await removeUsersFromGroup(groupId, usersToRemove);
    if (usersToAdd.length > 0) {
      await addUsersToGroup(groupId, usersToAdd);
    }

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
  // TODO: https://linear.app/skylight-cdc/issue/QUE-216/refactor-user-management-code-into-service-class-pattern
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
    const groupsWithQueries = await Promise.all(
      result.rows.map(async (group) => {
        const groupQueries = await getAllGroupQueries(group.id);
        group.queries = groupQueries.items;
        await dbClient.query("COMMIT");
        return group;
      }),
    );

    return {
      totalItems: result.rowCount,
      items: groupsWithQueries,
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
  // TODO: https://linear.app/skylight-cdc/issue/QUE-216/refactor-user-management-code-into-service-class-pattern
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
): Promise<QCResponse<CustomUserQuery>> {
  try {
    const selectQueriesByGroupQuery = `
    SELECT ugtq.id as membership_id, ug.name as usergroup_name, ug.id as usergroup_id,q.id as query_id, q.query_name, q.query_data, q.conditions_list
    FROM query as q
    LEFT JOIN usergroup_to_query as ugtq ON ugtq.query_id = q.id
    LEFT JOIN usergroup ug ON ug.id = ugtq.usergroup_id 
    WHERE ugtq.usergroup_id = $1;
    `;
    const result = await dbClient.query(selectQueriesByGroupQuery, [groupId]);

    const groupQueries = await Promise.all(
      result.rows.map(async (row) => {
        const groupAssignments = await fetchQueryGroupAssignmentDetails(result);

        const formattedQuery: CustomUserQuery = {
          query_id: row.query_id,
          query_name: row.query_name,
          valuesets: row.query_data,
          conditions_list: row.conditions_list,
          groupAssignments: groupAssignments,
        };

        await dbClient.query("COMMIT");
        return formattedQuery;
      }),
    );

    return {
      totalItems: result.rowCount,
      items: groupQueries,
    } as QCResponse<CustomUserQuery>;
  } catch (error) {
    throw error;
  }
}

/**
 * Adds users to a user group.
 * @param groupId - The unique identifier of the user group.
 * @param queryIds - The unique identifier of the query to add.
 * @returns The IDs of the queries added to the group.
 */
export async function addQueriesToGroup(
  groupId: string,
  queryIds: string[],
): Promise<QCResponse<CustomUserQuery>> {
  if (!queryIds || queryIds.length <= 0 || !groupId)
    return { items: [], totalItems: 0 };

  try {
    const selectValues =
      queryIds.length > 1
        ? `SELECT * FROM unnest($1::text[], $2::uuid[], $3::uuid[])`
        : `VALUES ($1,$2,$3)
  `;
    const fullQuery = `
      INSERT INTO usergroup_to_query (id, query_id, usergroup_id)
      ${selectValues}
      ON CONFLICT DO NOTHING
      RETURNING query_id;
  `;
    const membershipIds = queryIds.map((queryId) => `${queryId}_${groupId}`);
    const groupIds: string[] = new Array(queryIds.length).fill(groupId);

    const values =
      queryIds.length > 1
        ? [membershipIds, queryIds, groupIds]
        : [membershipIds[0], queryIds[0], groupIds[0]];

    const insertQuery = {
      text: fullQuery,
      values: values as string[],
    };

    const result = await dbClient.query(insertQuery);
    const updatedQueries = await Promise.all(
      result.rows.map(async (result) => {
        const updatedQuery = (await getQueryById(
          result.query_id,
        )) as CustomUserQuery;
        const updatedGroupAssignments = await getSingleQueryGroupAssignments(
          result.query_id,
        );
        updatedQuery.groupAssignments = updatedGroupAssignments.items;
        await dbClient.query("COMMIT");

        return updatedQuery;
      }),
    );

    return { totalItems: result.rowCount || 0, items: updatedQueries };
  } catch (error) {
    console.error("Error adding query(s) to user group:", error);
    throw error;
  }
}

/**
 * Unassigns a query from a user group.
 * @param groupId - The unique identifier of the user group.
 * @param queryIds - The unique identifiers of the query to remove.
 * @returns The query with updated groupAssignment data
 */
export async function removeQueriesFromGroup(
  groupId: string,
  queryIds: string[],
): Promise<QCResponse<CustomUserQuery>> {
  if (!queryIds || !groupId) return { items: [], totalItems: 0 };

  try {
    const removeQuery = {
      text: `
      DELETE FROM usergroup_to_query 
      WHERE usergroup_id = $1 AND query_id = ANY($2)
      RETURNING query_id;
    `,
      values: [groupId, queryIds],
    };

    const result = await dbClient.query(removeQuery);

    const updatedQueries = await Promise.all(
      result.rows.map(async (updatedQuery) => {
        const updatedGroupAssignments = await getSingleQueryGroupAssignments(
          updatedQuery.query_id,
        );
        updatedQuery.groupAssignments = updatedGroupAssignments.items;
        await dbClient.query("COMMIT");

        return updatedQuery;
      }),
    );

    return {
      totalItems: result.rowCount || 0,
      items: updatedQueries,
    };
  } catch (error) {
    console.error("Error removing query from group:", error);
    throw error;
  }
}

/**
 * Retrieves a single query and its group assignment data
 * This method performs role checks before retrieving the data.
 * @param queryId - The unique identifier of the query to add.
 * @returns A single query with all group assignments.
 */
export async function getSingleQueryGroupAssignments(
  queryId: string,
): Promise<QCResponse<UserGroupMembership>> {
  // TODO: https://linear.app/skylight-cdc/issue/QUE-216/refactor-user-management-code-into-service-class-pattern
  try {
    const query = `
    SELECT
      q.query_name, q.id as query_id, ug.name as usergroup_name, ugtq.usergroup_id,
        COALESCE(ugtq.id, '') AS membership_id,
          CASE 
            WHEN ugtq.query_id IS NOT NULL THEN TRUE
            ELSE FALSE
          END AS is_member
    FROM
      usergroup ug
    LEFT JOIN usergroup_to_query as ugtq ON ugtq.usergroup_id = ug.id
    LEFT JOIN query q ON ugtq.query_id = q.id
    WHERE ugtq.query_id = $1
  `;

    const results = await dbClient.query(query, [queryId]);
    let queryResponse = results.rows;
    if (queryResponse.length > 0) {
      const groupAssignments = results.rows.map((row) => {
        return {
          membership_id: row.membership_id,
          usergroup_name: row.usergroup_name,
          usergroup_id: row.usergroup_id,
          is_member: true,
        };
      });

      return { totalItems: groupAssignments.length, items: groupAssignments };
    } else {
      return { totalItems: 0, items: [] };
    }
  } catch (error) {
    console.error("Error fetching groups for query:", error);
    throw error;
  }
}

/**
 * Retrieves group assignment data for the given queries and formats it on the CustomUserQuery object
 * @param queryList - The queries whose group assignments we are retrieving
 * @returns The updated query record list or an error if the update fails.
 */
async function fetchQueryGroupAssignmentDetails(queryList: QueryResult) {
  const queries = await Promise.all(
    queryList.rows.map(async (query) => {
      try {
        const groupWithQuery = await getSingleQueryGroupAssignments(
          query.query_id,
        );
        return groupWithQuery.items[0];
      } catch (error) {
        console.error(error);
        throw error;
      }
    }),
  );

  return queries;
}
