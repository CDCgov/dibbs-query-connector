"use server";

import { adminRequired } from "./db/decorators";
import dbService from "./db/service";

class QueryTimeboxingService {
  @adminRequired
  static async updateTimeboxSettings(
    queryId: string,
    conceptType: string,
    startDate: string,
    endDate: string,
  ) {
    const updateUserGroupMembersQuery = `
    INSERT INTO query_timeboxing (query_id, concept_type, time_window_start, time_window_end)
      VALUES($1, $2, $3, $4)
      ON CONFLICT(query_id, concept_type)
      DO UPDATE SET
        time_window_start = EXCLUDED.time_window_start,
        time_window_end = EXCLUDED.time_window_end
      RETURNING *;
    `;

    const result = await dbService.query(updateUserGroupMembersQuery, [
      queryId,
      conceptType,
      startDate,
      endDate,
    ]);

    return result.rows;
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
