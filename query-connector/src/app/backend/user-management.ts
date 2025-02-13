"use server";

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

  const { id, username, email, firstName, lastName } = userToken;
  const userIdentifier = username || email;

  try {
    console.log("Checking if user exists.");

    const checkUserQuery = `SELECT id, username FROM users WHERE username = $1;`;
    const userExists = await dbClient.query(checkUserQuery, [userIdentifier]);

    if (userExists.rows.length > 0) {
      console.log("User already exists in users:", userExists.rows[0].id);
      return userExists.rows[0]; // Return existing user
    }

    console.log("User not found. Proceeding to insert.");

    // Default role when adding a new user, which includes Super Admin, Admin, and Standard User.
    const qc_role = "Standard User";

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
export async function updateUserRole(id: string, newRole: string) {
  if (!id || !newRole) {
    console.error("Invalid input: id and newRole are required.");
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
    return result.rows[0];
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
}
