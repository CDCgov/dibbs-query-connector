"use server";

import { QueryResult } from "pg";
import { User, UserRole, UserGroup } from "../models/entities/users";
import { QCResponse } from "../models/responses/collections";
import { adminAccessCheck, superAdminAccessCheck } from "../utils/auth";
import { getDbClient } from "./dbClient";

const dbClient = getDbClient();

/**
 * @param username The identifier of the user we want to retrieve
 * @returns A single user result
 */
export async function getUserByUsername(username: string) {
  const checkUserQuery = `SELECT * FROM users WHERE username = $1;`;
  const result = await dbClient.query(checkUserQuery, [username]);
  return result.rows[0];
}

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
      return { msg: "User already exists", user: userExists.rows[0] }; // Return existing user
    }

    // Default role when adding a new user, which includes Super Admin, Admin, and Standard User.
    let qc_role = UserRole.STANDARD;
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
 * Updates an existing user in the users table.
 * @param userId - The user ID from the JWT token.
 * @param updated_userName - The username from the JWT token.
 * @param updated_firstName - The first name from the JWT token.
 * @param updated_lastName - The last name from the JWT token.
 * @param updated_role - The role from the JWT token.
 * @returns The newly added user or an empty result if already exists.
 */
export async function updateUserDetails(
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

  try {
    console.log("Checking if user exists.");

    const checkUserQuery = `SELECT id, username, qc_role FROM users WHERE id = $1;`;
    const userExists = await dbClient.query(checkUserQuery, [userId]);

    if (userExists.rowCount == 0) {
      console.log("User not found in Users", userId);
      return { msg: "Unable to update user", userId: userId };
    }

    const { username, qc_role, first_name, last_name } = userExists.rows[0];
    if (
      username !== updated_userName ||
      qc_role !== updated_role ||
      first_name !== updated_firstName ||
      last_name !== updated_lastName
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

      const result = await dbClient.query(insertUserQuery, [
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
 * Retrieves group membership data for the given users and formats it on the User object
 * @param userList - The users whose group memberships we are retrieving
 * @returns The updated user record or an error if the update fails.
 */
async function fetchUserGroupMembershipDetails(userList: QueryResult) {
  const users = await Promise.all(
    userList.rows.map(async (user) => {
      try {
        const userGroups = await getAllUserGroupsForUser(user.id);
        user.userGroupMemberships = userGroups.items;
        return user;
      } catch (error) {
        console.error(error);
        throw error;
      }
    }),
  );

  return users;
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
    const userWithGroups = await fetchUserGroupMembershipDetails(result);

    return { totalItems: 1, items: userWithGroups };
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
}

/**
 * Checks whether a given user exists
 * @param userId - The unique identifier for the user
 * @returns The given user, if it exists
 */
export async function checkUserExists(
  userId: string,
): Promise<QCResponse<User>> {
  if (!userId) {
    return { totalItems: 0, items: [] };
  }

  const userCheckQuery = {
    text: `SELECT * FROM users WHERE id = $1;`,
    values: [userId],
  };

  const userCheckResult = await dbClient.query(userCheckQuery);

  return {
    totalItems: userCheckResult.rowCount,
    items: userCheckResult.rows,
  } as QCResponse<User>;
}

/**
 * Retrieves all registered users in query connector
 * @returns List of users registered in qc
 */
export async function getAllUsers(): Promise<QCResponse<User>> {
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
    const usersWithGroups = await fetchUserGroupMembershipDetails(result);

    return {
      totalItems: result.rowCount,
      items: usersWithGroups,
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
 * Retrieves the user group(s) for a given user
 * @param userId identifier of the user whose groups we are retrieving
 * @returns A list of UserGroup items for the given user
 */
export async function getAllUserGroupsForUser(
  userId: string,
): Promise<QCResponse<UserGroup[]>> {
  if (!(await adminAccessCheck())) {
    throw new Error("Unauthorized");
  }
  try {
    const selectAllUsersGroupsQuery = `
     SELECT  u.id as user_id, ug.name as usergroup_name, ug.id as usergroup_id, 
      COALESCE(member_count, 0) AS member_size,
      COALESCE(query_count, 0) AS query_size
    FROM usergroup_to_users as ugtu
    LEFT JOIN users as u ON u.id = ugtu.user_id  
    LEFT JOIN usergroup as ug ON ug.id = ugtu.usergroup_id
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
    WHERE ugtu.user_id = $1
    `;

    const result = await dbClient.query(selectAllUsersGroupsQuery, [userId]);

    return {
      totalItems: result.rowCount,
      items: result.rows,
    } as QCResponse<UserGroup[]>;
  } catch (error) {
    console.error("Error retrieving user groups:", error);
    throw error;
  }
}

/**
 * Retrieves the full user object with all group membership(s)
 * @param userId - The unique identifier of the user.
 * @returns A User with an updated list of UserGroupMembership items
 */
export async function getSingleUserWithGroupMemberships(
  userId: string,
): Promise<QCResponse<User>> {
  if (!(await adminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  const userCheckResult = await checkUserExists(userId);
  if (!userCheckResult || userCheckResult?.totalItems == 0) {
    return { totalItems: 0, items: [] };
  }

  const query = {
    text: `
      SELECT  ug.id as membership_id, g.id as usergroup_id, g.name as usergroup_name
      FROM usergroup_to_users as ug
      LEFT JOIN users as u
        ON u.id = ug.user_id
      LEFT JOIN usergroup as g
        ON g.id = ug.usergroup_id
      WHERE ug.user_id = $1;
    `,
    values: [userId],
  };

  const result = await dbClient.query(query);
  console.log(result.rows);
  const memberships = result.rows.map((row) => {
    return {
      membership_id: row.membership_id,
      usergroup_id: row.usergroup_id,
      usergroup_name: row.usergroup_name,
      is_member: true,
    };
  });

  const userWithGroups = {
    id: userId,
    username: userCheckResult.items[0].username,
    first_name: userCheckResult.items[0].first_name,
    last_name: userCheckResult.items[0].last_name,
    qc_role: userCheckResult.items[0].qc_role,
    userGroupMemberships: memberships,
  };
  console.log(userWithGroups);
  return { totalItems: 1, items: [userWithGroups] };
}

/**
 * Retrieves the user group membership for a specific user group.
 * @param groupId - The unique identifier of the user group.
 * @returns A list of users with membership status for the specified group.
 */
export async function getAllUsersWithSingleGroupStatus(
  groupId: string,
): Promise<User[]> {
  if (!(await adminAccessCheck())) {
    throw new Error("Unauthorized");
  }

  const groupCheckQuery = {
    text: `SELECT id FROM usergroup WHERE id = $1;`,
    values: [groupId],
  };
  const groupCheckResult = await dbClient.query(groupCheckQuery);
  if (groupCheckResult.rows.length === 0) {
    return [];
  }

  const query = {
    text: `
      SELECT u.id, u.username, u.first_name, u.last_name, u.qc_role, g.name AS group_name, g.id as usergroup_id,
        COALESCE(ug.id, '') AS membership_id,
        CASE 
          WHEN ug.user_id IS NOT NULL THEN TRUE
          ELSE FALSE
        END AS is_member
      FROM users u
      LEFT JOIN usergroup_to_users ug 
        ON u.id = ug.user_id AND ug.usergroup_id = $1
      LEFT JOIN usergroup g 
        ON ug.usergroup_id = g.id
        ORDER BY u.last_name, u.first_name;
    `,
    values: [groupId],
  };

  const result = await dbClient.query(query);

  return result.rows.map((row) => ({
    id: row.id,
    username: row.username,
    first_name: row.first_name,
    last_name: row.last_name,
    qc_role: row.qc_role,
    userGroupMemberships: [
      {
        membership_id: row.membership_id,
        usergroup_id: groupId,
        usergroup_name: row.group_name,
        is_member: row.is_member,
      },
    ],
  }));
}
