import { UUID, randomUUID } from "crypto";
import { ValueSet } from "./constants";

// TODO: Potentially merge this / infer this from the type created via the
// database creation workstream
export type QueryInput = {
  queryName: string;
  author: string;
  valueSets: ValueSet[];
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

/**
 * Function that generates SQL for the query_to_valueset join table needed for
 * query building.
 * @param input - Values of the shape QueryInput needed for query insertion
 * @param queryId - ID of the query that's already been created to associate with
 * a given valueset
 * @returns An array of {sql, values} to be inserted by the join insertion flow
 */
export function generateQueryToValueSetInsertionSql(
  input: QueryInput,
  queryId: UUID,
) {
  const joinInsertionSqlArray = input.valueSets.map((v) => {
    const sql =
      "INSERT INTO query_to_valueset VALUES($1,$2,$3,$4) RETURNING query_id, valueset_id;";
    const queryToValueSetId = `${queryId}_${v.valueSetId}`;
    const values = [
      queryToValueSetId,
      queryId,
      v.valueSetId,
      v.valueSetExternalId,
    ];

    return { sql: sql, values: values } as const;
  });
  return joinInsertionSqlArray;
}

// Type definition for CustomUserQueries
export interface CustomUserQuery {
  query_id: string;
  query_name: string;
  valuesets: ValueSet[];
}
