// Importing "../db/service" runs `new DbService()` at module load, which throws
// `DATABASE_URL is not set`. The target only consumes the `DbClient` type from
// it, so we stub the module with a bare class.
jest.mock("../db/service", () => ({ DbClient: class {} }));

import { insertConceptSql, insertValuesetToConceptSql } from "./seedSqlStructs";
import {
  generateValuesetConceptJoinSqlPromises,
  generateConceptSqlPromises,
} from "./utils";
import { DibbsValueSet } from "@/app/models/entities/valuesets";

type MockDbClient = { query: jest.Mock };

function makeMockDbClient(): MockDbClient {
  return { query: jest.fn().mockResolvedValue({ rows: [] }) };
}

describe("generateConceptSqlPromises", () => {
  function makeValueSet(): DibbsValueSet {
    return {
      valueSetId: "oid-1_v1",
      valueSetVersion: "v1",
      valueSetName: "VS",
      valueSetExternalId: "oid-1",
      author: "auth",
      system: "http://loinc.org",
      ersdConceptType: "lotc",
      dibbsConceptType: "labs",
      includeValueSet: false,
      concepts: [
        { code: "111", display: "One", include: true },
        { code: "222", display: "Two", include: true },
      ],
      userCreated: false,
    } as DibbsValueSet;
  }

  it("calls query once per concept with the concept insert SQL and args", () => {
    const dbClient = makeMockDbClient();
    generateConceptSqlPromises(makeValueSet(), dbClient as never);

    expect(dbClient.query).toHaveBeenCalledTimes(2);
    expect(dbClient.query).toHaveBeenNthCalledWith(1, insertConceptSql, [
      "loinc_111",
      "111",
      "http://loinc.org",
      "One",
    ]);
    expect(dbClient.query).toHaveBeenNthCalledWith(2, insertConceptSql, [
      "loinc_222",
      "222",
      "http://loinc.org",
      "Two",
    ]);
  });

  it("uses an empty system prefix when the value set has no system", () => {
    const dbClient = makeMockDbClient();
    const vs = makeValueSet();
    vs.system = "";
    vs.concepts = [{ code: "999", display: "Nine", include: true }];

    generateConceptSqlPromises(vs, dbClient as never);

    expect(dbClient.query).toHaveBeenCalledWith(insertConceptSql, [
      "_999",
      "999",
      "",
      "Nine",
    ]);
  });
});

describe("generateValuesetConceptJoinSqlPromises", () => {
  function makeValueSet(): DibbsValueSet {
    return {
      valueSetId: "oid-1_v1",
      valueSetVersion: "v1",
      valueSetName: "VS",
      valueSetExternalId: "oid-1",
      author: "auth",
      system: "http://loinc.org",
      ersdConceptType: "lotc",
      dibbsConceptType: "labs",
      includeValueSet: false,
      concepts: [{ code: "111", display: "One", include: true }],
      userCreated: false,
    } as DibbsValueSet;
  }

  it("calls query once per concept with the join insert SQL and composed ids", () => {
    const dbClient = makeMockDbClient();
    generateValuesetConceptJoinSqlPromises(makeValueSet(), dbClient as never);

    expect(dbClient.query).toHaveBeenCalledTimes(1);
    expect(dbClient.query).toHaveBeenCalledWith(insertValuesetToConceptSql, [
      "oid-1_v1_loinc_111",
      "oid-1_v1",
      "loinc_111",
    ]);
  });
});
