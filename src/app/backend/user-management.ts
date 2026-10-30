"use server";

import type { QueryResult } from "pg";
import {
  User,
  UserRole,
  UserGroup,
  UserGroupMembership,
} from "../models/entities/users";
import { QCResponse } from "../models/responses/collections";
import dbService from "./db/service";

import { auditable } from "./audit-logs/decorator";
import {
  addUserIfNotExists as provisionUser,
  updateUserDetails as syncUserDetails,
} from "./auth/user-provisioning";
import {
  adminRequired,
  superAdminRequired,
  authenticationRequired,
} from "./db/decorators/auth";

export interface UserToken {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  qcRole: UserRole;
  email?: string;
}
class UserManagementServiceInternal {
  protected static async getAllUsers() {
    try {
      const selectAllUsersQuery = `
      SELECT id, username, qc_role, first_name, last_name
      FROM users
      ORDER BY last_name, first_name ASC;
    `;

      const result = await dbService.query(selectAllUsersQuery);
      const usersWithGroups =
        await UserManagementServiceInternal.getUserGroupMembershipDetails(
          result,
        );

      return {
        totalItems: result.rowCount,
        items: usersWithGroups,
      } as QCResponse<User>;
    } catch (error) {
      throw error;
    }
  }

  protected static async getAllUserGroupsForUser(
    userId: string,
  ): Promise<QCResponse<UserGroup[]>> {
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

      const result = await dbService.query(selectAllUsersGroupsQuery, [userId]);

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
   * Retrieves group membership data for the given users and formats it on the User object
   * @param userList - The users whose group memberships we are retrieving
   * @returns The updated user record or an error if the update fails.
   */
  protected static async getUserGroupMembershipDetails(userList: QueryResult) {
    const users = await Promise.all(
      userList.rows.map(async (user) => {
        try {
          const userGroups =
            await UserManagementServiceInternal.getAllUserGroupsForUser(
              user.id,
            );
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
}

class UserManagementService extends UserManagementServiceInternal {
  /**
   * @param username The identifier of the user we want to retrieve
   * @returns A single user result, with any applicable group membership details
   */
  @adminRequired
  static async getUserByUsername(username: string): Promise<QCResponse<User>> {
    const userQuery = `SELECT * FROM users WHERE username = $1;`;
    const result = await dbService.query(userQuery, [username]);

    if (result.rowCount && result.rowCount > 0) {
      const user = result.rows[0];
      const userWithGroups =
        await UserManagementService.getSingleUserWithGroupMemberships(user.id);
      return {
        totalItems: userWithGroups.totalItems,
        items: userWithGroups.items,
      };
    } else {
      return { totalItems: 0, items: [] };
    }
  }

  /**
   * @param userId The identifier of the user we want to retrieve
   * @returns A single user result, with any applicable group membership details
   */
  @adminRequired
  static async getUserById(userId: string): Promise<QCResponse<User>> {
    const userQuery = `SELECT * FROM users WHERE id = $1;`;
    const result = await dbService.query(userQuery, [userId]);

    if (result.rowCount && result.rowCount > 0) {
      const user = result.rows[0];
      const userWithGroups =
        await UserManagementService.getSingleUserWithGroupMemberships(user.id);
      return {
        totalItems: userWithGroups.totalItems,
        items: userWithGroups.items,
      };
    } else {
      return { totalItems: 0, items: [] };
    }
  }
  /**
   * Adds a user to the users table if they do not already exist. Sign-in
   * provisioning calls the ungated version in auth/user-provisioning directly.
   * @param userToken - Info for the user to add
   * @returns The newly added user, or the existing user if already present
   */
  @superAdminRequired
  static async addUserIfNotExists(userToken: UserToken) {
    return provisionUser(userToken);
  }

  /**
   * Updates an existing user in the users table.
   * @param userId - The ID of the user to update
   * @param updated_userName - The new username
   * @param updated_firstName - The new first name
   * @param updated_lastName - The new last name
   * @param updated_role - The new role; must be a UserRole value
   * @returns The updated user, or nothing if no fields changed
   */
  @superAdminRequired
  static async updateUserDetails(
    userId: string,
    updated_userName: string,
    updated_firstName: string,
    updated_lastName: string,
    updated_role: string,
  ) {
    return syncUserDetails(
      userId,
      updated_userName,
      updated_firstName,
      updated_lastName,
      updated_role,
    );
  }

  /**
   * Retrieves group membership data for the given users and formats it on the User object
   * @param userList - The users whose group memberships we are retrieving
   * @returns The updated user record or an error if the update fails.
   */
  @adminRequired
  static async getUserGroupMembershipDetails(userList: QueryResult) {
    return super.getUserGroupMembershipDetails(userList);
  }

  /**
   * Updates the role of an existing user in the users table.
   * @param userId - The user ID.
   * @param newRole - The new role to assign to the user.
   * @returns The updated user record or an error if the update fails.
   */
  @superAdminRequired
  @auditable
  static async updateUserRole(
    userId: string,
    newRole: UserRole,
  ): Promise<QCResponse<User>> {
    try {
      console.log(`Updating role for user ID: ${userId} to ${newRole}`);

      const updateQuery = `
      UPDATE users
      SET qc_role = $1
      WHERE id = $2
      RETURNING id, username, qc_role, first_name, last_name;
    `;

      const result = await dbService.query(updateQuery, [newRole, userId]);

      if (result.rows.length === 0) {
        console.error(`User not found: ${userId}`);
        throw new Error(`User not found: ${userId}`);
      }

      console.log(`User role updated successfully: ${userId} -> ${newRole}`);
      const userWithGroups = await getUserGroupMembershipDetails(result);

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
  static async checkUserExists(userId: string): Promise<QCResponse<User>> {
    if (!userId) {
      return { totalItems: 0, items: [] };
    }

    const userCheckQuery = `SELECT * FROM users WHERE id = $1;`;
    const userCheckResult = await dbService.query(userCheckQuery, [userId]);

    return {
      totalItems: userCheckResult.rowCount,
      items: userCheckResult.rows,
    } as QCResponse<User>;
  }

  /**
   * Retrieves all registered users in query connector
   * @returns List of users registered in qc
   */
  @adminRequired
  static async getAllUsers(): Promise<QCResponse<User>> {
    return await super.getAllUsers();
  }

  /**
   * Retrieves the user group(s) for a given user
   * @param userId identifier of the user whose groups we are retrieving
   * @returns A list of UserGroup items for the given user
   */
  @adminRequired
  static async getAllUserGroupsForUser(
    userId: string,
  ): Promise<QCResponse<UserGroup[]>> {
    return await super.getAllUserGroupsForUser(userId);
  }

  /**
   * Retrieves the full user object with all group membership(s)
   * @param userId - The unique identifier of the user.
   * @returns A User with an updated list of UserGroupMembership items
   */
  @adminRequired
  static async getSingleUserWithGroupMemberships(
    userId: string,
  ): Promise<QCResponse<User>> {
    const userCheckResult = await UserManagementService.checkUserExists(userId);
    if (!userCheckResult || userCheckResult?.totalItems == 0) {
      return { totalItems: 0, items: [] };
    }

    const query = `
      SELECT  ug.id as membership_id, g.id as usergroup_id, g.name as usergroup_name
      FROM usergroup_to_users as ug
      LEFT JOIN users as u
        ON u.id = ug.user_id
      LEFT JOIN usergroup as g
        ON g.id = ug.usergroup_id
      WHERE ug.user_id = $1;
    `;

    const result = await dbService.query(query, [userId]);

    const memberships: UserGroupMembership[] = result.rows.map((row) => {
      const { membershipId, usergroupId, usergroupName } = row;
      return {
        membershipId,
        usergroupId,
        usergroupName,
        isMember: true,
      };
    });

    const userWithGroups = {
      id: userId,
      username: userCheckResult.items[0].username,
      firstName: userCheckResult.items[0].firstName,
      lastName: userCheckResult.items[0].lastName,
      qcRole: userCheckResult.items[0].qcRole,
      userGroupMemberships: memberships,
    };

    return { totalItems: 1, items: [userWithGroups] };
  }

  /**
   * Retrieves the user group membership for a specific user group.
   * @param groupId - The unique identifier of the user group.
   * @returns A list of users with membership status for the specified group.
   */
  @adminRequired
  static async getAllUsersWithSingleGroupStatus(
    groupId: string,
  ): Promise<User[]> {
    const groupCheckQuery = `SELECT id FROM usergroup WHERE id = $1;`;
    const groupCheckResult = await dbService.query(groupCheckQuery, [groupId]);
    if (groupCheckResult.rows.length === 0) {
      return [];
    }

    const query = `
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
    `;
    const result = await dbService.query(query, [groupId]);

    return result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      firstName: row.firstName,
      lastName: row.lastName,
      qcRole: row.qcRole,
      userGroupMemberships: [
        {
          membershipId: row.membershipId,
          usergroupId: groupId,
          usergroupName: row.groupName,
          isMember: row.isMember,
        },
      ],
    }));
  }

  @authenticationRequired
  static async getAllAdmins() {
    const allUsers = await super.getAllUsers();

    return allUsers.items.filter((u) => {
      return u.qcRole === UserRole.ADMIN || u.qcRole === UserRole.SUPER_ADMIN;
    });
  }
}

export const getUserByUsername = UserManagementService.getUserByUsername;
export const getUserById = UserManagementService.getUserById;
export const addUserIfNotExists = UserManagementService.addUserIfNotExists;
export const updateUserDetails = UserManagementService.updateUserDetails;
export const updateUserRole = UserManagementService.updateUserRole;
export const getUserGroupMembershipDetails =
  UserManagementService.getUserGroupMembershipDetails;
export const getAllUserGroupsForUser =
  UserManagementService.getAllUserGroupsForUser;
export const getAllUsers = UserManagementService.getAllUsers;
export const getAllAdmins = UserManagementService.getAllAdmins;
export const getAllUsersWithSingleGroupStatus =
  UserManagementService.getAllUsersWithSingleGroupStatus;
export const getSingleUserWithGroupMemberships =
  UserManagementService.getSingleUserWithGroupMemberships;
