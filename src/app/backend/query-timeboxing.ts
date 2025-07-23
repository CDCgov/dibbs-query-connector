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

  static async getTimeboxRanges(queryId: string, conceptType: string) {
    const timeboxSelectionQuery = `
        SELECT time_window_start, time_window_end FROM query_timeboxing
        WHERE query_id = $1 AND concept_type = $2;
    `;

    const result = await dbService.query(timeboxSelectionQuery, [
      queryId,
      conceptType,
    ]);

    return result.rows.map((v) => {
      return {
        startDate: v.timeWindowStart,
        endDate: v.timeWindowEnd,
      };
    })[0];
  }
}

export const getTimeboxRanges = QueryTimeboxingService.getTimeboxRanges;
export const updateTimeboxSettings =
  QueryTimeboxingService.updateTimeboxSettings;
