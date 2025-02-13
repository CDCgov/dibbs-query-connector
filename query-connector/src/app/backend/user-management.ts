"use server";

import { RoleTypeValues, User } from "../models/entities/user-management";
import { QCResponse } from "../models/responses/collections";
import { superAdminAccessCheck } from "../utils/auth";
import { getDbClient } from "./dbClient";
const dbClient = getDbClient();

/**
 * Adds a user to the user_management table if they do not already exist.
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

  const { id, username, email, firstName, lastName } = userToken;
  const userIdentifier = username || email;

  try {
    console.log("Checking if user exists:", id);

    const checkUserQuery = `SELECT username FROM user_management WHERE username = $1;`;
    const userExists = await dbClient.query(checkUserQuery, [userIdentifier]);

    if (userExists.rows.length > 0) {
      console.log("User already exists in user_management:", id);
      return userExists.rows[0];
    }

    console.log("User not found. Proceeding to insert:", id);

    // Default role when adding a new user, which includer Super Admin, Admin, and Standard User.
    const qc_role = "Standard User";

    const insertUserQuery = `
      INSERT INTO user_management (username, qc_role, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING username, qc_role, first_name, last_name;
    `;

    const result = await dbClient.query(insertUserQuery, [
      userIdentifier,
      qc_role,
      firstName,
      lastName,
    ]);

    console.log("User added to user_management", id);
    return result.rows[0];
  } catch (error) {
    console.error("Error adding user to user_management:", error);
    throw error;
  }
}

/**
 * Updates the role of an existing user in the user_management table.
 * @param id - The user ID from the JWT token.
 * @param username - The username of the user whose role is being updated.
 * @param newRole - The new role to assign to the user.
 * @returns The updated user record or an error if the update fails.
 */
export async function updateUserRole(
  id: string,
  username: string,
  newRole: RoleTypeValues,
): Promise<QCResponse<User>> {
  // TODO uncomment id check after it has been added to the table
  if (/*!id ||*/ !username || !newRole) {
    console.error("Invalid input: id, username, and newRole are required.");
    throw new Error("User ID, username, and new role are required.");
  }

  try {
    console.log(`Updating role for user: ${id} to ${newRole}`);

    const updateQuery = `
      UPDATE user_management
      SET qc_role = $1
      WHERE username = $2
      RETURNING username, qc_role, first_name, last_name;
    `;

    const result = await dbClient.query(updateQuery, [newRole, username]);

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
  if (!superAdminAccessCheck()) {
    throw new Error("Unauthorized");
  }

  try {
    const selectAllUsersQuery = `
      SELECT username, qc_role, first_name, last_name
      FROM user_management
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
      SELECT username, qc_role, first_name, last_name
      FROM user_management
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
