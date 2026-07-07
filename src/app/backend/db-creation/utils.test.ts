// Importing "../db/service" runs `new DbService()` at module load, which throws
// `DATABASE_URL is not set`. The target only consumes the `DbClient` type from
// it, so we stub the module with a bare class.
jest.mock("../db/service", () => ({ DbClient: class {} }));

import { BundleEntry, ValueSet as FhirValueSet } from "fhir/r4";
import { insertConceptSql, insertValuesetToConceptSql } from "./seedSqlStructs";
import {
  isUmbrellaErsdId,
  stripErsdVersionSuffix,
  stripProtocolAndTLDFromSystemUrl,
  translateVSACToInternalValueSet,
  indexErsdByOid,
  generateValuesetConceptJoinSqlPromises,
  generateConceptSqlPromises,
} from "./utils";
import { DibbsValueSet } from "@/app/models/entities/valuesets";

type MockDbClient = { query: jest.Mock };

function makeMockDbClient(): MockDbClient {
  return { query: jest.fn().mockResolvedValue({ rows: [] }) };
}

describe("isUmbrellaErsdId", () => {
  it("returns false for undefined", () => {
    expect(isUmbrellaErsdId(undefined)).toBe(false);
  });

  it("matches a bare umbrella prefix (v1/v2 shape)", () => {
    expect(isUmbrellaErsdId("dxtc")).toBe(true);
    expect(isUmbrellaErsdId("mrtc")).toBe(true);
  });

  it("matches a versioned umbrella prefix (v3 shape)", () => {
    expect(isUmbrellaErsdId("dxtc-3.1.2")).toBe(true);
    expect(isUmbrellaErsdId("sdtc-20240619")).toBe(true);
  });

  it("returns false for a non-umbrella oid", () => {
    expect(isUmbrellaErsdId("2.16.840.1.113762.1.4")).toBe(false);
  });

  it("does not match a prefix that is only a substring without the dash separator", () => {
    // `dxtcish` shares the prefix but is neither equal nor `dxtc-`-prefixed
    expect(isUmbrellaErsdId("dxtcish")).toBe(false);
  });
});

describe("stripErsdVersionSuffix", () => {
  it("strips a trailing 8-digit date suffix", () => {
    expect(stripErsdVersionSuffix("2.16.840.1.113762-20240619")).toBe(
      "2.16.840.1.113762",
    );
  });

  it("leaves ids without a date suffix unchanged", () => {
    expect(stripErsdVersionSuffix("2.16.840.1.113762")).toBe(
      "2.16.840.1.113762",
    );
  });

  it("does not strip a non-8-digit trailing number", () => {
    expect(stripErsdVersionSuffix("oid-1234")).toBe("oid-1234");
  });
});

describe("stripProtocolAndTLDFromSystemUrl", () => {
  it("extracts the first host segment from an http(s) URL", () => {
    expect(stripProtocolAndTLDFromSystemUrl("http://loinc.org")).toBe("loinc");
    expect(
      stripProtocolAndTLDFromSystemUrl(
        "https://www.nlm.nih.gov/research/umls/rxnorm",
      ),
    ).toBe("www");
  });

  it("returns the input unchanged when there is no protocol match", () => {
    expect(stripProtocolAndTLDFromSystemUrl("urn:oid:2.16.840")).toBe(
      "urn:oid:2.16.840",
    );
  });
});

describe("translateVSACToInternalValueSet", () => {
  function makeFhirValueSet(): FhirValueSet {
    return {
      resourceType: "ValueSet",
      id: "2.16.840.1.113762.1.4.1146.6",
      version: "20230602",
      title: "Sample Diagnosis ValueSet",
      publisher: "CSTE Steward",
      status: "active",
      compose: {
        include: [
          {
            system: "http://snomed.info/sct",
            concept: [
              { code: "111", display: "Concept One" },
              { code: "222", display: "Concept Two" },
            ],
          },
        ],
      },
    };
  }

  it("maps top-level FHIR fields onto the internal value set", () => {
    const result = translateVSACToInternalValueSet(makeFhirValueSet(), "dxtc");

    expect(result.valueSetId).toBe("2.16.840.1.113762.1.4.1146.6_20230602");
    expect(result.valueSetVersion).toBe("20230602");
    expect(result.valueSetName).toBe("Sample Diagnosis ValueSet");
    expect(result.valueSetExternalId).toBe("2.16.840.1.113762.1.4.1146.6");
    expect(result.author).toBe("CSTE Steward");
    expect(result.system).toBe("http://snomed.info/sct");
    expect(result.ersdConceptType).toBe("dxtc");
    expect(result.dibbsConceptType).toBe("conditions");
    expect(result.includeValueSet).toBe(false);
    expect(result.userCreated).toBe(false);
  });

  it("maps included concepts and defaults `include` to false", () => {
    const result = translateVSACToInternalValueSet(makeFhirValueSet(), "lotc");

    expect(result.concepts).toEqual([
      { code: "111", display: "Concept One", include: false },
      { code: "222", display: "Concept Two", include: false },
    ]);
  });

  it("resolves dibbsConceptType via the ersdToDibbs map for lab types", () => {
    const result = translateVSACToInternalValueSet(makeFhirValueSet(), "mrtc");
    expect(result.dibbsConceptType).toBe("medications");
  });

  it("leaves concepts undefined when the first include has no concept array", () => {
    const fhir = makeFhirValueSet();
    delete fhir.compose!.include[0].concept;
    const result = translateVSACToInternalValueSet(fhir, "dxtc");
    expect(result.concepts).toBeUndefined();
  });
});

describe("indexErsdByOid", () => {
  it("returns empty structures for undefined input", () => {
    const result = indexErsdByOid(undefined);
    expect(result.oidToErsdType.size).toBe(0);
    expect(result.nonUmbrellaValueSets).toEqual([]);
  });

  it("indexes referenced oids by umbrella type and strips |version suffixes", () => {
    const entries: BundleEntry[] = [
      {
        resource: {
          resourceType: "ValueSet",
          id: "dxtc",
          status: "active",
          compose: {
            include: [
              // v3-style: one include entry per referenced value set,
              // each canonical URL carries a `|version` suffix.
              {
                valueSet: ["http://example.org/ValueSet/oid-A|20230602"],
              },
              {
                valueSet: ["http://example.org/ValueSet/oid-B|20230602"],
              },
            ],
          },
        },
      },
      {
        resource: {
          resourceType: "ValueSet",
          id: "mrtc",
          status: "active",
          compose: {
            // v2-style: multiple refs packed into a single include entry.
            include: [
              {
                valueSet: [
                  "http://example.org/ValueSet/oid-C",
                  "http://example.org/ValueSet/oid-D",
                ],
              },
            ],
          },
        },
      },
    ];

    const { oidToErsdType } = indexErsdByOid(entries);

    expect(oidToErsdType.get("oid-A")).toBe("dxtc");
    expect(oidToErsdType.get("oid-B")).toBe("dxtc");
    expect(oidToErsdType.get("oid-C")).toBe("mrtc");
    expect(oidToErsdType.get("oid-D")).toBe("mrtc");
    expect(oidToErsdType.size).toBe(4);
  });

  it("collects only non-umbrella resources into nonUmbrellaValueSets", () => {
    const leafValueSet: FhirValueSet = {
      resourceType: "ValueSet",
      id: "oid-A",
      status: "active",
    };
    const entries: BundleEntry[] = [
      {
        resource: {
          resourceType: "ValueSet",
          id: "dxtc-3.1.2",
          status: "active",
          compose: { include: [{ valueSet: ["http://x/ValueSet/oid-A"] }] },
        },
      },
      { resource: leafValueSet },
    ];

    const { nonUmbrellaValueSets } = indexErsdByOid(entries);

    expect(nonUmbrellaValueSets).toHaveLength(1);
    expect(nonUmbrellaValueSets[0].id).toBe("oid-A");
  });
});

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
