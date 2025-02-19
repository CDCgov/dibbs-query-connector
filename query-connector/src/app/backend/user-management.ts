"use server";

import { RoleTypeValues, User } from "../models/entities/user-management";
import { QCResponse } from "../models/responses/collections";
import { superAdminAccessCheck } from "../utils/auth";
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

    // First registered user is set as Super Admin
    const queryUserRecordCount = `SELECT COUNT(*) FROM users`;
    const userCount = await dbClient.query(queryUserRecordCount);

    if (userCount?.rows?.[0]?.count === "0") {
      qc_role = RoleTypeValues.SuperAdmin;
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
