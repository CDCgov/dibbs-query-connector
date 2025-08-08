"use server";

import { QueryTableTimebox } from "../(pages)/queryBuilding/utils";
import { DibbsConceptType } from "../models/entities/valuesets";
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

    return result.rows.map((v) => {
      return {
        timeWindowStart: v.timeWindowStart,
        timeWindowEnd: v.timeWindowEnd,
      };
    })[0];
  }

  static async linkTimeboxRangesToQuery(queryId: string) {
    const timeboxSql = `SELECT * FROM query_timeboxing WHERE query_id=$1;`;

    const relatedTimeboxes = await dbService.query(timeboxSql, [queryId]);
    const timeboxInfo: QueryTableTimebox = {};
    relatedTimeboxes.rows.forEach((t) => {
      timeboxInfo[t.conceptType as DibbsConceptType] = {
        timeWindowStart: t.timeWindowStart.toISOString(),
        timeWindowEnd: t.timeWindowEnd.toISOString(),
      };
    });

    return timeboxInfo;
  }
}

export const getTimeboxRanges = QueryTimeboxingService.getTimeboxRanges;
export const linkTimeboxRangesToQuery =
  QueryTimeboxingService.linkTimeboxRangesToQuery;
export const deleteTimeboxSettings =
  QueryTimeboxingService.deleteTimeboxSettings;
export const updateTimeboxSettings =
  QueryTimeboxingService.updateTimeboxSettings;
