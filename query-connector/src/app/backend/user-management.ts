"use server";
import {
  RoleTypeValues,
  User,
  UserGroup,
} from "../models/entities/user-management";
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
 * @returns The newly added user or an empty result if already exists.
 */
export async function addUserIfNotExists(userToken: {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  if (!userToken || !userToken.username) {
    console.error("Invalid user token. Cannot add user.");
    return;
  }

  const { username, email, firstName, lastName } = userToken;
  const userIdentifier = username || email;

  try {
    console.log("Checking if user exists.");

    const checkUserQuery = `SELECT id, username FROM users WHERE username = $1;`;
    const userExists = await dbClient.query(checkUserQuery, [userIdentifier]);

    if (userExists.rows.length > 0) {
      console.log("User already exists in users:", userExists.rows[0].id);
      return userExists.rows[0]; // Return existing user
    }

    // Default role when adding a new user, which includes Super Admin, Admin, and Standard User.
    let qc_role = RoleTypeValues.Standard;
    console.log("User not found. Proceeding to insert.");

    if (process.env.NODE_ENV !== "production") {
      // First registered user is set as Super Admin
      const queryUserRecordCount = `SELECT COUNT(*) FROM users`;
      const userCount = await dbClient.query(queryUserRecordCount);

      if (userCount?.rows?.[0]?.count === "0") {
        qc_role = RoleTypeValues.SuperAdmin;
      }
    }

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
 * @param id - The user ID.
 * @param newRole - The new role to assign to the user.
 * @returns The updated user record or an error if the update fails.
 */
export async function updateUserRole(
  id: string,
  newRole: RoleTypeValues,
): Promise<QCResponse<User>> {
  if (!(await superAdminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  if (!id || !newRole) {
    throw new Error("User ID and new role are required.");
  }

  try {
    console.log(`Updating role for user ID: ${id} to ${newRole}`);

    const updateQuery = `
      UPDATE users
      SET qc_role = $1
      WHERE id = $2
      RETURNING id, username, qc_role, first_name, last_name;
    `;

    const result = await dbClient.query(updateQuery, [newRole, id]);

    if (result.rows.length === 0) {
      console.error(`User not found: ${id}`);
      throw new Error(`User not found: ${id}`);
    }

    console.log(`User role updated successfully: ${id} -> ${newRole}`);
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
  if (!(await superAdminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  try {
    const selectAllUsersQuery = `
      SELECT id, username, qc_role, first_name, last_name
      FROM users
      ORDER BY last_name, first_name ASC;
    `;

    const result = await dbClient.query(selectAllUsersQuery);

    return {
      totalItems: result.rowCount,
      items: result.rows,
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
    const selectUsersQuery = `
      SELECT id, username, qc_role, first_name, last_name
      FROM users
      WHERE username = $1;
    `;

    const result = await dbClient.query(selectUsersQuery, [username]);

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
        COALESCE(member_count, 0) AS memberSize,
        COALESCE(query_count, 0) AS querySize
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
 * Creates a new user group if it does not already exist.
 * @param groupName - The name of the user group to create.
 * @returns The created user group or an error message if it already exists.
 */
export async function createUserGroup(
  groupName: string,
): Promise<UserGroup | string> {
  if (!(await adminAccessCheck())) {
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
      memberSize: 0,
      querySize: 0,
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
 * @returns The updated user group or an error if the update fails.
 */
export async function updateUserGroup(
  id: string,
  newName: string,
): Promise<UserGroup | string> {
  if (!(await adminAccessCheck())) {
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

    const updateGroupQuery = `
      UPDATE usergroup
      SET name = $1
      WHERE id = $2
      RETURNING id, name;
    `;

    const result = await dbClient.query(updateGroupQuery, [newName, id]);

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
      memberSize: updatedGroup?.memberSize ?? 0,
      querySize: updatedGroup?.querySize ?? 0,
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
      memberSize: 0,
      querySize: 0,
    };
  } catch (error) {
    console.error("Error deleting user group:", error);
    throw error;
  }
}
