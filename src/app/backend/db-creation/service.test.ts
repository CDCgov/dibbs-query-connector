import { DibbsValueSet } from "@/app/models/entities/valuesets";
import ExampleVsacValueSet from "../../tests/assets/VSACValueSet.json";
import { ValueSet as FhirValueSet } from "fhir/r4";
import {
  isUmbrellaErsdId,
  stripErsdVersionSuffix,
  translateVSACToInternalValueSet,
} from "./utils";

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

describe("VSAC FHIR response to internal application type", () => {
  it("translate to expected fixture", () => {
    const translationResult = translateVSACToInternalValueSet(
      ExampleVsacValueSet as FhirValueSet,
      "ostc",
    );

    expect(translationResult).toEqual(EXPECTED_INTERNAL_VALUESET);
  });
});

describe("stripErsdVersionSuffix", () => {
  it("strips an 8-digit date suffix from an eRSD v3 resource id", () => {
    expect(
      stripErsdVersionSuffix("2.16.840.1.113762.1.4.1146.560-20240619"),
    ).toBe("2.16.840.1.113762.1.4.1146.560");
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
});

describe("isUmbrellaErsdId", () => {
  it("matches bare umbrella prefixes (eRSD v1/v2)", () => {
    expect(isUmbrellaErsdId("dxtc")).toBe(true);
    expect(isUmbrellaErsdId("ostc")).toBe(true);
  });

  it("matches versioned umbrella ids (eRSD v3)", () => {
    expect(isUmbrellaErsdId("dxtc-3.1.2")).toBe(true);
    expect(isUmbrellaErsdId("sdtc-3.1.2")).toBe(true);
  });

  it("does not match non-umbrella OIDs", () => {
    expect(isUmbrellaErsdId("2.16.840.1.113762.1.4.1146.560")).toBe(false);
    expect(isUmbrellaErsdId("2.16.840.1.113762.1.4.1146.560-20240619")).toBe(
      false,
    );
  });

  it("returns false for undefined or empty ids", () => {
    expect(isUmbrellaErsdId(undefined)).toBe(false);
    expect(isUmbrellaErsdId("")).toBe(false);
  });
});
