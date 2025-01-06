import { randomUUID } from "crypto";
import { DibbsValueSet } from "./constants";

// TODO: Potentially merge this / infer this from the type created via the
// database creation workstream
export type QueryInput = {
  queryName: string;
  author: string;
  valueSets: DibbsValueSet[];
  timeWindowUnit?: string; // TODO: should probably type this more strongly
  timeWindowNumber?: Number;
};

const DEFAULT_TIME_WINDOW = {
  timeWindowNumber: 1,
  timeWindowUnit: "day",
};

/**
 * Function that generates SQL needed for the query building flow
 * @param input - Values of the shape QueryInput needed for query insertion
 * @returns [sql, values] needed for query building insertion
 */
export function generateQueryInsertionSql(input: QueryInput) {
  const id = randomUUID();
  const dateCreated = new Date().toISOString();
  const dateLastModified = new Date().toISOString();

  const sql =
    "INSERT INTO query VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id, query_name;";

  const values = [
    id,
    input.queryName,
    input.author,
    dateCreated,
    dateLastModified,
    input?.timeWindowNumber ?? DEFAULT_TIME_WINDOW.timeWindowNumber,
    input?.timeWindowUnit ?? DEFAULT_TIME_WINDOW.timeWindowUnit,
  ];

  return { sql: sql, values: values } as const;
}

// Type definition for CustomUserQueries
export interface CustomUserQuery {
  query_id: string;
  query_name: string;
  conditions_list?: string;
  valuesets: DibbsValueSet[];
}
