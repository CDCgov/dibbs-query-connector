"use server";

import { QueryTableTimebox } from "../(pages)/queryBuilding/utils";
import { DibbsConceptType } from "../models/entities/valuesets";
import { DateRange } from "../ui/designSystem/timeboxing/DateRangePicker";
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

  static async getTimeboxRanges(queryId: string, conceptType: string) {
    const timeboxSelectionQuery = `
        SELECT time_window_start, time_window_end FROM query_timeboxing
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
        };
      })[0];
    }

    return undefined;
  }
  static async getQueryTimeboxRanges(queryId: string) {
    const timeboxSelectionQuery = `
        SELECT time_window_start, time_window_end, concept_type FROM query_timeboxing
        WHERE query_id = $1;
    `;

    const result = await dbService.query(timeboxSelectionQuery, [queryId]);

    const conceptTimebox: Partial<{
      [conceptType in DibbsConceptType]: DateRange;
    }> = {};

    if (result) {
      result.rows.forEach((v) => {
        conceptTimebox[v.conceptType as DibbsConceptType] = {
          startDate: v.timeWindowStart,
          endDate: v.timeWindowEnd,
        };
      });
    }

    return conceptTimebox;
  }

  static async linkTimeboxRangesToQuery(queryId: string) {
    const timeboxSql = `SELECT * FROM query_timeboxing WHERE query_id=$1;`;

    const relatedTimeboxes = await dbService.query(timeboxSql, [queryId]);
    const timeboxInfo: QueryTableTimebox = {};
    relatedTimeboxes.rows.forEach((t) => {
      let timeWindowStart = t.timeWindowStart;
      let timeWindowEnd = t.timeWindowEnd;

      if (t.isRelativeRange) {
        // we want the relative ranges, so take the time delta and apply it to the current date
        const endDate = new Date(timeWindowEnd);
        const startDate = new Date(timeWindowStart);
        const timeDeltaMilliseconds = endDate.getTime() - startDate.getTime();

        timeWindowEnd = new Date();
        timeWindowStart = new Date();
        timeWindowStart.setTime(
          timeWindowEnd.getTime() - timeDeltaMilliseconds,
        );
      }
      return (timeboxInfo[t.conceptType as DibbsConceptType] = {
        timeWindowStart: timeWindowStart.toISOString(),
        timeWindowEnd: timeWindowEnd.toISOString(),
      });
    });

    return timeboxInfo;
  }
}

export const getTimeboxRanges = QueryTimefilteringService.getTimeboxRanges;
export const getQueryTimeboxRanges =
  QueryTimefilteringService.getQueryTimeboxRanges;
export const linkTimeboxRangesToQuery =
  QueryTimefilteringService.linkTimeboxRangesToQuery;
export const deleteTimeboxSettings =
  QueryTimefilteringService.deleteTimeboxSettings;
export const updateTimeboxSettings =
  QueryTimefilteringService.updateTimeboxSettings;
