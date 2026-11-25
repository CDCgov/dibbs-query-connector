import { suppressConsoleLogs } from "@/app/tests/integration/fixtures";
import {
  createErsdPayload,
  isUmbrellaErsdId,
  isVsacOid,
  stripErsdVersionSuffix,
  stripProtocolAndTLDFromSystemUrl,
  translateVSACToInternalValueSet,
} from "./process-data";
import ExampleVsacValueSet from "../app/tests/assets/VSACValueSet.json";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { BundleEntry, ValueSet as FhirValueSet } from "fhir/r4";

const EXPECTED_INTERNAL_VALUESET: DibbsValueSet = {
  valueSetId: `${ExampleVsacValueSet.id}_${ExampleVsacValueSet.version}`,
  valueSetVersion: ExampleVsacValueSet.version,
  valueSetName: ExampleVsacValueSet.title,
  valueSetExternalId: ExampleVsacValueSet.id,
  author: ExampleVsacValueSet.publisher,
  system: ExampleVsacValueSet.compose.include[0].system,
  ersdConceptType: "ostc",
  dibbsConceptType: "labs",
  includeValueSet: false,
  userCreated: false,
  concepts: ExampleVsacValueSet.compose.include[0].concept.map((c) => {
    return { ...c, include: false };
  }),
};

jest.mock("@/seed/api-calls", () => ({
  getVSACValueset: jest.fn(),
}));

jest.mock("@/app/utils/auth", () => ({}));

jest.mock("@/app/backend/audit-logs/lib", () => ({
  generateAuditSuccessMessage: jest.fn(),
  generateAuditValues: jest.fn(),
}));

describe("stripErsdVersionSuffix", () => {
  it("strips an 8-digit date suffix from an eRSD v3 resource id", () => {
    expect(
      stripErsdVersionSuffix("2.16.840.1.113762.1.4.1146.560-20240619"),
    ).toBe("2.16.840.1.113762.1.4.1146.560");
    expect(stripErsdVersionSuffix("2.16.840.1.113762-20240619")).toBe(
      "2.16.840.1.113762",
    );
  });

  it("leaves bare OIDs (eRSD v1/v2) unchanged", () => {
    expect(stripErsdVersionSuffix("2.16.840.1.113762.1.4.1146.560")).toBe(
      "2.16.840.1.113762.1.4.1146.560",
    );
  });

  it("does not strip umbrella version suffixes (semver-like)", () => {
    expect(stripErsdVersionSuffix("dxtc-3.1.2")).toBe("dxtc-3.1.2");
  });

  it("returns an empty string unchanged", () => {
    expect(stripErsdVersionSuffix("")).toBe("");
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

describe("isUmbrellaErsdId", () => {
  it("matches bare umbrella prefixes (eRSD v1/v2)", () => {
    expect(isUmbrellaErsdId("dxtc")).toBe(true);
    expect(isUmbrellaErsdId("ostc")).toBe(true);
    expect(isUmbrellaErsdId("mrtc")).toBe(true);
  });

  it("matches versioned umbrella ids (eRSD v3)", () => {
    expect(isUmbrellaErsdId("dxtc-3.1.2")).toBe(true);
    expect(isUmbrellaErsdId("sdtc-3.1.2")).toBe(true);
    expect(isUmbrellaErsdId("sdtc-20240619")).toBe(true);
  });

  it("does not match non-umbrella OIDs", () => {
    expect(isUmbrellaErsdId("2.16.840.1.113762.1.4.1146.560")).toBe(false);
    expect(isUmbrellaErsdId("2.16.840.1.113762.1.4.1146.560-20240619")).toBe(
      false,
    );
    expect(isUmbrellaErsdId("2.16.840.1.113762.1.4")).toBe(false);
  });

  it("returns false for undefined or empty ids", () => {
    expect(isUmbrellaErsdId(undefined)).toBe(false);
    expect(isUmbrellaErsdId("")).toBe(false);
  });

  it("does not match a prefix that is only a substring without the dash separator", () => {
    // `dxtcish` shares the prefix but is neither equal nor `dxtc-`-prefixed
    expect(isUmbrellaErsdId("dxtcish")).toBe(false);
  });
});

describe("isVsacOid", () => {
  it("matches bare and date-versioned OIDs", () => {
    expect(isVsacOid("2.16.840.1.113762.1.4.1146.560")).toBe(true);
    expect(isVsacOid("2.16.840.1.113762.1.4.1146.560-20240619")).toBe(true);
  });

  it("rejects umbrella ids, including ones we don't map to a concept type", () => {
    expect(isVsacOid("dxtc")).toBe(false);
    expect(isVsacOid("dxtc-3.2.0")).toBe(false);
    expect(isVsacOid("eltc-3.2.0")).toBe(false);
    expect(isVsacOid("artc-3.2.0")).toBe(false);
  });

  it("rejects provisional value set ids", () => {
    expect(isVsacOid("hantavirus-provisional-codes-PROVISIONAL")).toBe(false);
  });

  it("returns false for undefined or empty ids", () => {
    expect(isVsacOid(undefined)).toBe(false);
    expect(isVsacOid("")).toBe(false);
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
  beforeEach(() => {
    suppressConsoleLogs();
  });
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

  it("translate to expected fixture", () => {
    const translationResult = translateVSACToInternalValueSet(
      ExampleVsacValueSet as FhirValueSet,
      "ostc",
    );

    expect(translationResult).toEqual(EXPECTED_INTERNAL_VALUESET);
  });

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

describe("createErsdPayload", () => {
  it("indexes referenced oids by umbrella type and strips |version suffixes", () => {
    const entries: BundleEntry<FhirValueSet>[] = [
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

    const { oidToErsdResourceMap } = createErsdPayload(entries);

    expect(oidToErsdResourceMap.get("oid-A")).toBe("dxtc");
    expect(oidToErsdResourceMap.get("oid-B")).toBe("dxtc");
    expect(oidToErsdResourceMap.get("oid-C")).toBe("mrtc");
    expect(oidToErsdResourceMap.get("oid-D")).toBe("mrtc");
    expect(oidToErsdResourceMap.size).toBe(4);
  });

  it("types immunization-only value sets as iztc without overriding mrtc", () => {
    const entries: BundleEntry<FhirValueSet>[] = [
      {
        resource: {
          resourceType: "ValueSet",
          id: "mrtc-3.2.0",
          status: "active",
          compose: {
            include: [{ valueSet: ["http://example.org/ValueSet/oid-shared"] }],
          },
        },
      },
      {
        resource: {
          resourceType: "ValueSet",
          id: "iztc-3.2.0",
          status: "active",
          compose: {
            include: [
              { valueSet: ["http://example.org/ValueSet/oid-shared"] },
              { valueSet: ["http://example.org/ValueSet/oid-iz-only"] },
            ],
          },
        },
      },
    ];

    const { oidToErsdResourceMap } = createErsdPayload(entries);

    expect(oidToErsdResourceMap.get("oid-shared")).toBe("mrtc");
    expect(oidToErsdResourceMap.get("oid-iz-only")).toBe("iztc");
  });

  it("collects only non-umbrella resources into conditions", () => {
    const leafValueSet: FhirValueSet = {
      resourceType: "ValueSet",
      id: "2.16.840.1.113883.6.238",
      status: "active",
      useContext: [
        {
          code: {
            system: "http://terminology.hl7.org/CodeSystem/usage-context-type",
            code: "focus",
          },
          valueCodeableConcept: {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "61094002",
              },
            ],
            text: "La Crosse encephalitis (disorder)",
          },
        },
      ],
    };
    const entries: BundleEntry<FhirValueSet>[] = [
      {
        resource: {
          resourceType: "ValueSet",
          id: "dxtc-3.1.2",
          status: "active",
          compose: {
            include: [
              { valueSet: ["http://x/ValueSet/2.16.840.1.113883.6.238"] },
            ],
          },
        },
      },
      { resource: leafValueSet },
    ];

    const { conditions } = createErsdPayload(entries);

    expect(conditions).toHaveLength(1);
    expect(conditions[0].valueset_id).toBe("2.16.840.1.113883.6.238");
  });
});
