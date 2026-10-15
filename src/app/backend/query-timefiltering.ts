"use server";

import { DibbsConceptType } from "../models/entities/valuesets";
import { DateRangeInfo } from "../ui/designSystem/timeboxing/DateRangePicker";
import { adminRequired } from "./db/decorators";
import dbService from "./db/service";

class QueryTimefilteringService {
  @adminRequired
  static async updateTimeboxSettings(
    queryId: string,
    conceptType: string,
    startDate: string,
    endDate: string,
    isRelativeRange = true,
  ) {
    const updateUserGroupMembersQuery = `
    INSERT INTO query_timeboxing (query_id, concept_type, time_window_start, time_window_end, is_relative_range)
      VALUES($1, $2, $3, $4, $5)
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
      isRelativeRange,
    ]);

    return result.rows;
  }

  @adminRequired
  static async deleteTimeboxSettings(queryId: string, conceptType: string) {
    const updateUserGroupMembersQuery = `
       DELETE FROM query_timeboxing WHERE query_id = $1 AND concept_type = $2;
    `;

    const result = await dbService.query(updateUserGroupMembersQuery, [
      queryId,
      conceptType,
    ]);

    return result.rows;
  }

  @adminRequired
  static async getTimeboxRanges(queryId: string, conceptType: string) {
    const timeboxSelectionQuery = `
        SELECT time_window_start, time_window_end, is_relative_range FROM query_timeboxing
        WHERE query_id = $1 AND concept_type = $2;
    `;

    const result = await dbService.query(timeboxSelectionQuery, [
      queryId,
      conceptType,
    ]);

    if (result) {
      return result.rows.map((v) => {
        return {
          startDate: v.timeWindowStart,
          endDate: v.timeWindowEnd,
          isRelativeRange: v.isRelativeRange,
        };
      })[0];
    }

    return undefined;
  }
  @adminRequired
  static async getQueryTimeboxRanges(queryId: string) {
    const timeboxSelectionQuery = `
        SELECT time_window_start, time_window_end, concept_type, is_relative_range FROM query_timeboxing
        WHERE query_id = $1;
    `;

    const result = await dbService.query(timeboxSelectionQuery, [queryId]);

    const conceptTimebox: Partial<{
      [conceptType in DibbsConceptType]: DateRangeInfo;
    }> = {};

    if (result) {
      result.rows.forEach((v) => {
        conceptTimebox[v.conceptType as DibbsConceptType] = {
          startDate: v.timeWindowStart,
          endDate: v.timeWindowEnd,
          isRelativeRange: v.isRelativeRange,
        };
      });
    }

    return conceptTimebox;
  }
}

export const getTimeboxRanges = QueryTimefilteringService.getTimeboxRanges;
export const getQueryTimeboxRanges =
  QueryTimefilteringService.getQueryTimeboxRanges;
export const deleteTimeboxSettings =
  QueryTimefilteringService.deleteTimeboxSettings;
export const updateTimeboxSettings =
  QueryTimefilteringService.updateTimeboxSettings;
