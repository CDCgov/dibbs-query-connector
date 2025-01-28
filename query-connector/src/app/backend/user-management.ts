"use server";

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
  console.log("addUserIfNotExists called with userToken:", userToken);

  if (!userToken || !userToken.username) {
    console.error("Invalid user token. Cannot add user.");
    return;
  }

  const { username, email, firstName, lastName } = userToken;
  const userIdentifier = username || email;

  try {
    console.log("Checking if user exists:", userIdentifier);

    const checkUserQuery = `SELECT username FROM user_management WHERE username = $1;`;
    const userExists = await dbClient.query(checkUserQuery, [userIdentifier]);

    console.log("Check user query result:", userExists.rows);

    if (userExists.rows.length > 0) {
      console.log("User already exists in user_management:", userIdentifier);
      return userExists.rows[0];
    }

    console.log("User not found. Proceeding to insert:", userIdentifier);

    const qc_role = "super-admin";

    const insertUserQuery = `
      INSERT INTO user_management (username, qc_role, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING username, qc_role, first_name, last_name;
    `;

    console.log("Executing insert query:", [
      userIdentifier,
      qc_role,
      firstName,
      lastName,
    ]);

    const result = await dbClient.query(insertUserQuery, [
      userIdentifier,
      qc_role,
      firstName,
      lastName,
    ]);

    console.log("User added to user_management:", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("Error adding user to user_management:", error);
    throw error;
  }
}
