import {
  insertCustomValueSet,
  getCustomCodeCondition,
} from "@/app/shared/custom-code-service";
import { getDbClient } from "@/app/backend/dbClient";
import { DibbsValueSet } from "@/app/models/entities/valuesets";

const dbClient = getDbClient();

describe("UserCreatedValuesetService Integration", () => {
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
    const result = await insertCustomValueSet(testVS, "user-123");
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
    expect(ctvsRes.rows[0].condition_id).toBe("custom_condition");
  });

  it("should create the Custom Code Condition if missing", async () => {
    await dbClient.query(
      `DELETE FROM condition_to_valueset WHERE condition_id = 'custom_condition'`,
    );
    await dbClient.query(
      `DELETE FROM conditions WHERE id = 'custom_condition'`,
    );

    const result = await getCustomCodeCondition("http://loinc.org");
    expect(result).toBe("custom_condition");

    const res = await dbClient.query(
      `SELECT * FROM conditions WHERE id = 'custom_condition'`,
    );
    expect(res.rowCount).toBe(1);
    expect(res.rows[0].name).toBe("Custom Code Condition");
  });
});
