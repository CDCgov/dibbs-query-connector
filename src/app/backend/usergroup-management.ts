"use server";
import { User, UserGroup, UserGroupMembership } from "../models/entities/users";
import { getSingleUserWithGroupMemberships } from "./user-management";

import { QCResponse } from "../models/responses/collections";
import { CustomUserQuery } from "../models/entities/query";
import { QueryResult } from "pg";
import dbService from "./db/service";
import { adminRequired } from "./db/decorators";
import { auditable } from "./audit-logs/decorator";
import { getQueryById } from "./query-building/service";

class UserGroupManagementService {
  /**
   * Creates a new user group if it does not already exist.
   * @param groupName - The name of the user group to create.
   * @returns The created user group or an error message if it already exists.
   */
  @adminRequired
  @auditable
  static async createUserGroup(
    groupName: string,
  ): Promise<QCResponse<UserGroup>> {
    try {
      // Check if the group name already exists
      const existingGroups = await getAllUserGroups();
      const groupExists =
        existingGroups.items?.some((group) => group.name === groupName) ??
        false;

      if (groupExists) {
        throw new Error(`User group '${groupName}' already exists.`);
      }

      const createGroupQuery = `
      INSERT INTO usergroup (name)
      VALUES ($1)
      RETURNING id, name;
    `;

      const result = await dbService.query(createGroupQuery, [groupName]);

      const newUserGroup = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        memberSize: 0,
        querySize: 0,
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
  @adminRequired
  @auditable
  static async updateUserGroup(
    id: string,
    newName: string,
  ): Promise<UserGroup | string> {
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

      const result = await dbService.query(updateUserGroupMembersQuery, [
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
  @adminRequired
  @auditable
  static async deleteUserGroup(id: string): Promise<UserGroup | string> {
    try {
      await dbService.query(
        "DELETE FROM usergroup_to_users WHERE usergroup_id = $1",
        [id],
      );
      await dbService.query(
        "DELETE FROM usergroup_to_query WHERE usergroup_id = $1",
        [id],
      );
      const deleteGroupQuery = `
      DELETE FROM usergroup
      WHERE id = $1
      RETURNING id, name;
    `;

      const result = await dbService.query(deleteGroupQuery, [id]);

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

  /**
   * Adds users to a user group.
   * @param groupId - The unique identifier of the user group.
   * @param userIds - The unique identifier(s) of the users to add.
   * @returns The user IDs of the users added to the group.
   */
  @adminRequired
  @auditable
  static async addUsersToGroup(
    groupId: string,
    userIds: string[],
  ): Promise<QCResponse<User>> {
    if (!userIds || userIds.length <= 0 || !groupId)
      return { items: [], totalItems: 0 };
    try {
      const membershipIds = userIds.map((userId) => `${userId}_${groupId}`);
      const groupIds: string[] = new Array(userIds.length).fill(groupId);

      const insertQuery = `
        INSERT INTO usergroup_to_users (id, user_id, usergroup_id)
        SELECT * FROM unnest($1::text[], $2::uuid[], $3::uuid[])
        ON CONFLICT DO NOTHING
        RETURNING user_id;
      `;
      const values = [membershipIds, userIds, groupIds];

      const result = await dbService.query(insertQuery, values);

      const updatedUsers = await Promise.all(
        result.rows.map(async (updatedUser) => {
          const updatedUserWithGroups = await getSingleUserWithGroupMemberships(
            updatedUser.userId,
          );

          await dbService.query("COMMIT");

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
  @auditable
  static async removeUsersFromGroup(
    groupId: string,
    userIds: string[],
  ): Promise<QCResponse<User>> {
    if (!userIds || !groupId) return { items: [], totalItems: 0 };

    try {
      const values = userIds.length > 1 ? `ANY($2)` : "$2";
      const insertQuery = `
      DELETE FROM usergroup_to_users 
      WHERE usergroup_id = $1 AND user_id = ${values}
      RETURNING user_id;
    `;
      const queryValues = [groupId, userIds.length > 1 ? userIds : userIds[0]];

      const result = await dbService.query(insertQuery, queryValues);
      const updatedUsers = await Promise.all(
        result.rows.map(async (updatedUser) => {
          const updatedUserWithGroups = await getSingleUserWithGroupMemberships(
            updatedUser.userId,
          );

          await dbService.query("COMMIT");

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
   * Retrieves all registered user groups in Query Connector along with member and query counts.
   * @returns A list of user groups registered in the query connector.
   */
  @adminRequired
  static async getAllUserGroups(): Promise<QCResponse<UserGroup>> {
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

      const result = await dbService.query(selectAllUserGroupQuery);
      const groupsWithQueries = await Promise.all(
        result.rows.map(async (group) => {
          const groupQueries = await getAllGroupQueries(group.id);
          group.queries = groupQueries.items;
          await dbService.query("COMMIT");
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
  @adminRequired
  static async getUserGroupById(id: string): Promise<UserGroup> {
    try {
      const selectAllUserGroupQuery = `
      SELECT id, name 
      FROM usergroup 
      WHERE id = $1 
    `;

      const result = await dbService.query(selectAllUserGroupQuery, [id]);

      return {
        id: result.rows[0].id,
        name: result.rows[0].name,
        memberSize: result.rows[0].memberSize,
        querySize: result.rows[0].querySize,
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
  static async getAllGroupMembers(groupId: string): Promise<QCResponse<User>> {
    try {
      const selectMembersByGroupQuery = `
    SELECT u.id, u.first_name, u.last_name, u.username, u.qc_role
    FROM users as u
    LEFT JOIN usergroup_to_users as ugtu ON ugtu.user_id = u.id
    WHERE ugtu.usergroup_id = $1;
    `;

      const result = await dbService.query(selectMembersByGroupQuery, [
        groupId,
      ]);
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
  static async getAllGroupQueries(
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
      const result = await dbService.query(selectQueriesByGroupQuery, [
        groupId,
      ]);

      const groupQueries = await Promise.all(
        result.rows.map(async (row) => {
          const groupAssignments =
            await UserGroupManagementService.fetchQueryGroupAssignmentDetails(
              result,
            );
          const { queryId, queryName, queryData, conditionsList } = row;

          const formattedQuery: CustomUserQuery = {
            queryId,
            queryName,
            valuesets: queryData,
            conditionsList,
            groupAssignments: groupAssignments,
          };

          await dbService.query("COMMIT");
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
  @auditable
  static async addQueriesToGroup(
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

      const result = await dbService.query(fullQuery, values);
      const updatedQueries = await Promise.all(
        result.rows.map(async (result) => {
          const updatedQuery = (await getQueryById(
            result.queryId,
          )) as CustomUserQuery;
          const updatedGroupAssignments = await getSingleQueryGroupAssignments(
            result.queryId,
          );
          updatedQuery.groupAssignments = updatedGroupAssignments.items;

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
  @auditable
  static async removeQueriesFromGroup(
    groupId: string,
    queryIds: string[],
  ): Promise<QCResponse<CustomUserQuery>> {
    if (!queryIds || !groupId) return { items: [], totalItems: 0 };

    try {
      const removeQuery = `
      DELETE FROM usergroup_to_query 
      WHERE usergroup_id = $1 AND query_id = ANY($2)
      RETURNING query_id;
    `;
      const values = [groupId, queryIds];

      const result = await dbService.query(removeQuery, values);

      const updatedQueries = await Promise.all(
        result.rows.map(async (updatedQuery) => {
          const updatedGroupAssignments = await getSingleQueryGroupAssignments(
            updatedQuery.queryId,
          );
          updatedQuery.groupAssignments = updatedGroupAssignments.items;
          await dbService.query("COMMIT");

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
  static async getSingleQueryGroupAssignments(
    queryId: string,
  ): Promise<QCResponse<UserGroupMembership>> {
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

      const results = await dbService.query(query, [queryId]);
      let queryResponse = results.rows;
      if (queryResponse.length > 0) {
        const groupAssignments = results.rows.map((row) => {
          const { membershipId, usergroupName, usergroupId } = row;
          return {
            membershipId,
            usergroupName,
            usergroupId,
            isMember: true,
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
  static async fetchQueryGroupAssignmentDetails(queryList: QueryResult) {
    const queries = await Promise.all(
      queryList.rows.map(async (query) => {
        try {
          const groupWithQuery = await getSingleQueryGroupAssignments(
            query.queryId,
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
}

export const createUserGroup = UserGroupManagementService.createUserGroup;
export const updateUserGroup = UserGroupManagementService.updateUserGroup;
export const deleteUserGroup = UserGroupManagementService.deleteUserGroup;
export const addUsersToGroup = UserGroupManagementService.addUsersToGroup;
export const getAllGroupMembers = UserGroupManagementService.getAllGroupMembers;
export const removeQueriesFromGroup =
  UserGroupManagementService.removeQueriesFromGroup;
export const removeUsersFromGroup =
  UserGroupManagementService.removeUsersFromGroup;
export const getAllUserGroups = UserGroupManagementService.getAllUserGroups;
export const getUserGroupById = UserGroupManagementService.getUserGroupById;
export const getAllGroupQueries = UserGroupManagementService.getAllGroupQueries;
export const addQueriesToGroup = UserGroupManagementService.addQueriesToGroup;
export const getSingleQueryGroupAssignments =
  UserGroupManagementService.getSingleQueryGroupAssignments;
