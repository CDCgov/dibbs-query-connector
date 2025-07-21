"use server";

import { adminRequired } from "./db/decorators";
import dbService from "./db/service";

class QueryTimeboxingService {
  @adminRequired
  static async updateTimeboxSettings(
    queryId: string,
    conceptType: string,
    startDate: Date,
    endDate: Date,
  ) {
    const updateUserGroupMembersQuery = `
        UPDATE query_timeboxing
        SET time_window_start = $4 
        SET time_window_end = $5
        WHERE query_id = $2 AND concept_type = $3
        RETURNING id, name; 
    `;

    const result = await dbService.query(updateUserGroupMembersQuery, [
      queryId,
      conceptType,
      startDate,
      endDate,
    ]);

    return result;
  }

  static async getTimeboxSettings(queryId: string, conceptType: string) {
    const selectTimeboxSettings = `
        SELECT FROM query_timeboxing
        WHERE query_id = $1
        RETURNING *; 
    `;

    const result = await dbService.query(selectTimeboxSettings, [
      queryId,
      conceptType,
    ]);

    return result;
  }
}

export const getTimeboxSetting = QueryTimeboxingService.getTimeboxSettings;
export const updateTimeboxSettings =
  QueryTimeboxingService.updateTimeboxSettings;
