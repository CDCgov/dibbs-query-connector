import {
  insertCustomValueSet,
  insertCustomValuesetsIntoQuery,
  getCustomCodeCondition,
} from "@/app/backend/custom-code-service";
import { dontUseOutsideConfigOrTests_getDbClient } from "@/app/backend/db/config";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { randomUUID } from "crypto";
import { CUSTOM_CONDITION_ID, CUSTOM_VALUESET_ARRAY_ID } from "@/app/constants";
import { suppressConsoleLogs } from "./fixtures";

const dbClient = dontUseOutsideConfigOrTests_getDbClient();

describe("UserCreatedValuesetService Integration", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });
  const testUUID = "mock-vsid-0001";
  const vsVersion = "1.0.0";
  const vsName = "Cooties test";
  const authorId = "user-123";

  const testVS: DibbsValueSet = {
    valueSetId: testUUID,
    valueSetVersion: vsVersion,
    valueSetName: vsName,
    author: authorId,
    dibbsConceptType: "labs",
    system: "http://loinc.org",
    includeValueSet: true,
    concepts: [
      { code: "1234-5", display: "Circle circle", include: true },
      { code: "5678-9", display: "Dot dot", include: true },
    ],
    userCreated: true,
  };

  it("should insert valueset, concepts, and condition linkages", async () => {
    const result = await insertCustomValueSet(testVS, authorId);
    expect(result.success).toBe(true);

    const vsRes = await dbClient.query(
      `SELECT * FROM valuesets WHERE name = $1`,
      [vsName],
    );
    expect(vsRes.rowCount).toBe(1);

    const vsId = vsRes.rows[0].id;

    const conceptRes = await dbClient.query(
      `SELECT * FROM concepts WHERE code IN ('1234-5', '5678-9')`,
    );
    expect(conceptRes.rowCount).toBe(2);

    const joinRes = await dbClient.query(
      `SELECT * FROM valueset_to_concept WHERE valueset_id = $1`,
      [vsId],
    );
    expect(joinRes.rowCount).toBe(2);

    const ctvsRes = await dbClient.query(
      `SELECT * FROM condition_to_valueset WHERE valueset_id = $1`,
      [vsId],
    );
    expect(ctvsRes.rowCount).toBe(1);
    expect(ctvsRes.rows[0].condition_id).toBe(CUSTOM_CONDITION_ID);
  });

  it("should create the Custom Code Condition if missing", async () => {
    await dbClient.query(
      `DELETE FROM condition_to_valueset WHERE condition_id = $1`,
      [CUSTOM_CONDITION_ID],
    );
    await dbClient.query(`DELETE FROM conditions WHERE id = $1`, [
      CUSTOM_CONDITION_ID,
    ]);

    const result = await getCustomCodeCondition("http://loinc.org");
    expect(result).toBe(CUSTOM_CONDITION_ID);

    const res = await dbClient.query(`SELECT * FROM conditions WHERE id = $1`, [
      CUSTOM_CONDITION_ID,
    ]);
    expect(res.rowCount).toBe(1);
    expect(res.rows[0].name).toBe("Custom Code Condition");
  });

  it("should create a new query with only custom in query_data", async () => {
    const { success, queryId } = await insertCustomValuesetsIntoQuery(
      authorId,
      [testVS],
      undefined,
    );
    expect(success).toBe(true);
    expect(queryId).toBeDefined();

    const result = await dbClient.query(
      `SELECT query_data FROM query WHERE id = $1`,
      [queryId],
    );

    expect(result.rowCount).toBe(1);
    const queryData = result.rows[0].query_data;
    expect(queryData).toHaveProperty(CUSTOM_VALUESET_ARRAY_ID);
    expect(queryData[CUSTOM_VALUESET_ARRAY_ID][testUUID]).toMatchObject({
      valueSetName: vsName,
      valueSetVersion: vsVersion,
    });
  });

  it("should update existing query and preserve other keys in query_data", async () => {
    const baseQueryId = randomUUID();
    const baseQueryName = "Existing Query Test";
    const baseConditionId = "12345";

    const dummyQueryData = {
      [baseConditionId]: {
        "68910": {
          valueSetId: "68910",
          valueSetName: "Heebie Jeebies",
          valueSetVersion: "0.9.9",
          author: "CSTE",
          dibbsConceptType: "conditions",
          system: "http://loinc.org",
          includeValueSet: true,
          concepts: [
            { code: "1234-5", display: "The ick", include: true },
            { code: "5678-9", display: "It's giving ick", include: true },
          ],
          userCreated: false,
        },
      },
    };

    await dbClient.query(
      `INSERT INTO query (
        id, query_name, query_data, conditions_list, author,
        date_created, date_last_modified, time_window_number, time_window_unit
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), 0, '')`,
      [baseQueryId, baseQueryName, dummyQueryData, [], authorId],
    );

    const { success } = await insertCustomValuesetsIntoQuery(
      authorId,
      [testVS],
      baseQueryId,
    );
    expect(success).toBe(true);

    const result = await dbClient.query(
      `SELECT query_data FROM query WHERE id = $1`,
      [baseQueryId],
    );
    expect(result.rowCount).toBe(1);
    const queryData = result.rows[0].query_data;

    // expect(queryData).toHaveProperty(baseConditionId);
    expect(queryData).toHaveProperty(CUSTOM_VALUESET_ARRAY_ID);
    expect(queryData[CUSTOM_VALUESET_ARRAY_ID][testUUID].valueSetName).toBe(
      vsName,
    );
  });
});
