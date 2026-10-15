import dbService from "../db/service";
import { auditable } from "../audit-logs/decorator";
import { UserRole } from "@/app/models/entities/users";
import type { UserToken } from "../user-management";

// User provisioning that has to run without a signed-in session. The sign-in
// callback in src/auth.ts creates and refreshes users before a session exists,
// and the access checks in utils/auth.ts look up roles, so none of this can
// live behind the gated actions in user-management.ts. This module must not
// be marked "use server": every export of such a module is a POST-able
// endpoint, and these functions perform no authorization of their own.
class UserProvisioningService {
  /**
   * Adds a user to the users table if they do not already exist.
   * Uses data extracted from the JWT token.
   * @param userToken - Info from the user to update
   * @param forceRefreshUser - Whether to force refresh a user if the user exists.
   * @returns The newly added user or an empty result if already exists.
   */
  @auditable
  static async addUserIfNotExists(
    userToken: UserToken,
    forceRefreshUser = false,
  ) {
    if (!userToken || !userToken.username) {
      console.error("Invalid user token. Cannot add user.");
      return { user: undefined };
    }

    const { username, email, firstName, lastName, qcRole } = userToken;
    const userIdentifier = username || email;

    try {
      console.log("Checking if user exists.");
      const checkUserQuery = `SELECT id, username, qc_Role, first_name, last_name FROM users WHERE username = $1;`;
      const userExists = await dbService.query(checkUserQuery, [
        userIdentifier,
      ]);

      if (userExists.rows.length > 0) {
        if (forceRefreshUser) {
          const existingUser = userExists.rows[0];
          const updatedUser = await UserProvisioningService.updateUserDetails(
            existingUser.id,
            username,
            firstName,
            lastName,
            qcRole,
          );
          return { msg: "Existing user updated", user: updatedUser }; // Return existing user
        } else {
          console.log("User already exists in users:", userExists.rows[0].id);
          return { msg: "User already exists", user: userExists.rows[0] }; // Return existing user
        }
      }

      if (!Object.values(UserRole).includes(qcRole)) {
        throw new Error(`Cannot add user, invalid role: ${qcRole}`);
      }

      // Default role when adding a new user, which includes Super Admin, Admin, and Standard User.
      console.log("User not found. Proceeding to insert.");

      const insertUserQuery = `
      INSERT INTO users (username, qc_role, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, qc_role, first_name, last_name;
    `;

      const result = await dbService.query(insertUserQuery, [
        userIdentifier,
        qcRole,
        firstName,
        lastName,
      ]);

      console.log("User added to users:", result.rows[0].id);
      return { user: result.rows[0] };
    } catch (error) {
      console.error("Error adding user to users:", error);
      throw error;
    }
  }

  /**
   * Updates an existing user in the users table.
   * @param userId - The user ID from the JWT token.
   * @param updated_userName - The username from the JWT token.
   * @param updated_firstName - The first name from the JWT token.
   * @param updated_lastName - The last name from the JWT token.
   * @param updated_role - The role from the JWT token.
   * @returns The newly added user or an empty result if already exists.
   */
  @auditable
  static async updateUserDetails(
    userId: string,
    updated_userName: string,
    updated_firstName: string,
    updated_lastName: string,
    updated_role: string,
  ) {
    if (!userId) {
      console.error("Cannot update user, no ID provided.");
      return;
    }

    if (!Object.values(UserRole).includes(updated_role as UserRole)) {
      throw new Error(`Cannot update user, invalid role: ${updated_role}`);
    }

    try {
      console.log("Checking if user exists.");

      const checkUserQuery = `SELECT id, username, qc_role FROM users WHERE id = $1;`;
      const userExists = await dbService.query(checkUserQuery, [userId]);

      if (userExists.rowCount == 0) {
        console.log("User not found in Users", userId);
        return { msg: "Unable to update user", userId: userId };
      }

      const { username, qcRole, firstName, lastName } = userExists.rows[0];
      if (
        username !== updated_userName ||
        qcRole !== updated_role ||
        firstName !== updated_firstName ||
        lastName !== updated_lastName
      ) {
        const insertUserQuery = `
        UPDATE users
        SET 
          username = $2,
          first_name = $3,
          last_name = $4,
          qc_role = $5
        WHERE id = $1
        RETURNING id, username, qc_role, first_name, last_name;
      `;

        const result = await dbService.query(insertUserQuery, [
          userId,
          updated_userName,
          updated_firstName,
          updated_lastName,
          updated_role,
        ]);

        console.log("User updated:", result.rows[0].id);
        return result.rows[0];
      } else {
        // nothing to update, carry on...
        return;
      }
    } catch (error) {
      console.error("Error updating user", error);
      throw error;
    }
  }

  /**
   * Retrieves a user's role
   * @param username user's username. Username must be unique.
   * @returns The user's role or empty if the user is not found
   */
  static async getUserRole(username: string): Promise<UserRole> {
    try {
      const selectUserRoleQuery = `
      SELECT id, username, qc_role, first_name, last_name
      FROM users
      WHERE username = $1;
    `;

      const result = await dbService.query(selectUserRoleQuery, [username]);
      if (result?.rowCount && result.rowCount > 0) {
        return result.rows?.[0].qcRole;
      } else {
        // user is not found, so fall back to least privilege
        return UserRole.STANDARD;
      }
    } catch (error) {
      throw error;
    }
  }
}

export const addUserIfNotExists = UserProvisioningService.addUserIfNotExists;
export const updateUserDetails = UserProvisioningService.updateUserDetails;
export const getUserRole = UserProvisioningService.getUserRole;
