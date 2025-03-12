"use server";

import { User, UserGroup, UserRole } from "../models/entities/users";
import { QueryTableResult } from "../(pages)/queryBuilding/utils";
import { QCResponse } from "../models/responses/collections";
import { adminAccessCheck, superAdminAccessCheck } from "../utils/auth";
import { getDbClient } from "./dbClient";
const dbClient = getDbClient();

/**
 * Adds a user to the users table if they do not already exist.
 * Uses data extracted from the JWT token.
 * @param userToken - The user data from the JWT token.
 * @param userToken.id - The user ID from the JWT token.
 * @param userToken.username - The username from the JWT token.
 * @param userToken.email - The email from the JWT token.
 * @param userToken.firstName - The first name from the JWT token.
 * @param userToken.lastName - The last name from the JWT token.
 * @param userToken.role - The role from the JWT token.
 * @returns The newly added user or an empty result if already exists.
 */
export async function addUserIfNotExists(userToken: {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}) {
  if (!userToken || !userToken.username) {
    console.error("Invalid user token. Cannot add user.");
    return;
  }

  const { username, email, firstName, lastName, role } = userToken;
  const userIdentifier = username || email;

  try {
    console.log("Checking if user exists.");

    const checkUserQuery = `SELECT id, username FROM users WHERE username = $1;`;
    const userExists = await dbClient.query(checkUserQuery, [userIdentifier]);

    if (userExists.rows.length > 0) {
      console.log("User already exists in users:", userExists.rows[0].id);
      return { msg: "User already exists", user: userExists.rows[0] }; // Return existing user
    }

    // Default role when adding a new user, which includes Super Admin, Admin, and Standard User.
    let qc_role = role ?? UserRole.STANDARD;
    console.log("User not found. Proceeding to insert.");

    const insertUserQuery = `
      INSERT INTO users (username, qc_role, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, qc_role, first_name, last_name;
    `;

    const result = await dbClient.query(insertUserQuery, [
      userIdentifier,
      qc_role,
      firstName,
      lastName,
    ]);

    console.log("User added to users:", result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error("Error adding user to users:", error);
    throw error;
  }
}

/**
 * Updates the role of an existing user in the users table.
 * @param userId - The user ID.
 * @param newRole - The new role to assign to the user.
 * @returns The updated user record or an error if the update fails.
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole,
): Promise<QCResponse<User>> {
  if (!(await superAdminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  if (!userId || !newRole) {
    throw new Error("User ID and new role are required.");
  }

  try {
    console.log(`Updating role for user ID: ${userId} to ${newRole}`);

    const updateQuery = `
      UPDATE users
      SET qc_role = $1
      WHERE id = $2
      RETURNING id, username, qc_role, first_name, last_name;
    `;

    const result = await dbClient.query(updateQuery, [newRole, userId]);

    if (result.rows.length === 0) {
      console.error(`User not found: ${userId}`);
      throw new Error(`User not found: ${userId}`);
    }

    console.log(`User role updated successfully: ${userId} -> ${newRole}`);
    return { totalItems: 1, items: [result.rows[0]] };
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
}

/**
 * Retrieves all registered users in query connector
 * @returns List of users registered in qc
 */
export async function getUsers(): Promise<QCResponse<User>> {
  if (!(await adminAccessCheck())) {
    // admins need read access to users for group management
    throw new Error("Unauthorized");
  }

  try {
    const selectAllUsersQuery = `
      SELECT id, username, qc_role, first_name, last_name
      FROM users
      ORDER BY last_name, first_name ASC;
    `;

    const result = await dbClient.query(selectAllUsersQuery);
    const users = await Promise.all(
      result.rows.map(async (user) => {
        try {
          const groups = await getUserGroupsForUser(user.id);
          user.user_groups = groups.items;
          return user;
        } catch (error) {
          console.error(error);
          throw error;
        }
      }),
    );

    return {
      totalItems: result.rowCount,
      items: users,
    } as QCResponse<User>;
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves a user's role
 * @param username user's username. Username must be unique.
 * @returns The user's role or empty if the user is not found
 */
export async function getUserRole(username: string): Promise<string> {
  try {
    const selectUserRoleQuery = `
      SELECT id, username, qc_role, first_name, last_name
      FROM users
      WHERE username = $1;
    `;

    const result = await dbClient.query(selectUserRoleQuery, [username]);
    return result?.rowCount && result.rowCount > 0
      ? result.rows?.[0].qc_role
      : "";
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves all registered user groups in query connector along with member and query counts.
 * @returns A list of user groups registered in the query connector.
 */
export async function getUserGroups(): Promise<QCResponse<UserGroup>> {
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
 * Retrieves the user group(s) for a given user
 * @param id identifier of the us user groups in query connector along with member and query counts.
 * @returns A list of user groups registered in the query connector.
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
 * Retrieves the user group(s) for a given user
 * @param userId identifier of the user whose groups we are retrieving
 * @returns A list of UserGroup items for the given user
 */
export async function getUserGroupsForUser(
  userId: string,
): Promise<QCResponse<UserGroup>> {
  if (!(await adminAccessCheck())) {
    throw new Error("Unauthorized");
  }
  try {
    const selectAllUsersGroupsQuery = `
    SELECT ug.name, ug.id
    FROM usergroup_to_users as ugtu 
    LEFT JOIN users as u ON u.id = ugtu.user_id  
    LEFT JOIN usergroup as ug ON ug.id = ugtu.usergroup_id
    WHERE ugtu.user_id = $1;
    `;

    const result = await dbClient.query(selectAllUsersGroupsQuery, [userId]);
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
    const existingGroups = await getUserGroups();
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
    const existingGroups = await getUserGroups();
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
    const userGroups = await getUserGroups();
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
 * Retrieves the members for a given user group
 * @param groupId identifier of the group whose members we are retrieving
 * @returns A list of User data for the given group
 */
export async function getGroupMembers(
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
export async function getGroupQueries(
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
