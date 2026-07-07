import { DibbsValueSet } from "../models/entities/valuesets";
import { CANCER_DB_QUERY_VALUES } from "../tests/unit/fixtures";
import {
  generateValueSetGroupingsByDibbsConceptType,
  getNameAuthorSystemFromVSGrouping,
  groupConditionConceptsIntoValueSets,
  groupValueSetsByConceptType,
  groupValueSetsByVsId,
} from "./valueSetTranslation";

// Minimal DibbsValueSet factory for exercising the grouping helpers directly.
function makeValueSet(overrides: Partial<DibbsValueSet> = {}): DibbsValueSet {
  return {
    valueSetId: "vs-1",
    valueSetVersion: "20240101",
    valueSetName: "Test Value Set",
    valueSetExternalId: "ext-1",
    author: "DIBBs",
    system: "http://snomed.info/sct",
    ersdConceptType: "dxtc",
    dibbsConceptType: "conditions",
    includeValueSet: true,
    userCreated: false,
    concepts: [{ code: "123", display: "A concept", include: true }],
    ...overrides,
  };
}

describe("translation utils", () => {
  let cancerSets: DibbsValueSet[] = groupConditionConceptsIntoValueSets(
    CANCER_DB_QUERY_VALUES,
  );
  describe("groupValueSetsByNameAuthorSystem", () => {
    it("returns expected grouped valueset", () => {
      const groupedValueSets = groupValueSetsByVsId(cancerSets);
      expect(Object.keys(groupedValueSets).length).toBe(4);
      expect(
        Object.values(groupedValueSets).map((v) => v.valueSetName),
      ).toContain("Cancer (Leukemia) Lab Result");
      expect(
        Object.values(groupedValueSets).map((v) => v.valueSetName),
      ).toContain("Cancer (Leukemia) Diagnosis Problem");
      expect(
        Object.values(groupedValueSets).map((v) => v.valueSetName),
      ).toContain("Cancer (Leukemia) Medication");
      expect(
        Object.values(groupedValueSets).map((v) => v.valueSetName),
      ).toContain("Suspected Cancer (Leukemia) Diagnosis");
    });
  });

  describe("generateValueSetGroupingsByDibbsConceptType", () => {
    it("returns the expected VsGroupings for each of the concept types", () => {
      const groupedValueSets =
        generateValueSetGroupingsByDibbsConceptType(cancerSets);

      expect(Object.values(groupedValueSets["labs"]).length).toBe(1);
      expect(Object.values(groupedValueSets["conditions"]).length).toBe(2);
      expect(Object.values(groupedValueSets["medications"]).length).toBe(1);
    });
  });

  describe("groupValueSetsByConceptType", () => {
    it("returns the expected DibbsValueSet arrays for each of the concept types", () => {
      const groupedValueSets = groupValueSetsByConceptType(cancerSets);

      expect(groupedValueSets["labs"].length).toBe(1);
      expect(groupedValueSets["conditions"].length).toBe(2);
      expect(groupedValueSets["medications"].length).toBe(1);
    });
  });

  describe("getNameAuthorSystemFromVSGrouping", () => {
    it("builds a name:author:system key from the value set", () => {
      const vs = makeValueSet({
        valueSetName: "Cancer Labs",
        author: "DIBBs",
        system: "http://loinc.org",
      });

      expect(getNameAuthorSystemFromVSGrouping(vs)).toBe(
        "Cancer Labs:DIBBs:http://loinc.org",
      );
    });
  });

  describe("groupValueSetsByVsId (edge cases)", () => {
    it("skips malformed rows missing author, system, or name", () => {
      const warnSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);

      const valid = makeValueSet({ valueSetId: "good-1" });
      const missingAuthor = makeValueSet({
        valueSetId: "bad-author",
        author: "",
      });
      const missingSystem = makeValueSet({
        valueSetId: "bad-system",
        system: "",
      });
      const missingName = makeValueSet({
        valueSetId: "bad-name",
        valueSetName: "",
      });

      const grouped = groupValueSetsByVsId([
        valid,
        missingAuthor,
        missingSystem,
        missingName,
      ]);

      expect(Object.keys(grouped)).toEqual(["good-1"]);
      expect(warnSpy).toHaveBeenCalledTimes(3);

      warnSpy.mockRestore();
    });

    it("keys the grouping by valueSetId and deep-copies concepts", () => {
      const concept = { code: "abc", display: "A", include: true };
      const vs = makeValueSet({ valueSetId: "vs-42", concepts: [concept] });

      const grouped = groupValueSetsByVsId([vs]);

      expect(Object.keys(grouped)).toEqual(["vs-42"]);
      // Concepts are copied, not referenced.
      expect(grouped["vs-42"].concepts[0]).not.toBe(concept);
      expect(grouped["vs-42"].concepts[0]).toEqual(concept);
    });
  });

  describe("groupConditionConceptsIntoValueSets (edge cases)", () => {
    const baseRow = {
      valueSetId: "10_2024",
      version: "2024",
      valueSetName: "Sample VS",
      valueSetExternalId: "10",
      author: "DIBBs",
      codeSystem: "http://loinc.org",
      type: "dxtc",
      dibbsConceptType: "labs",
      conditionId: "2",
    };

    it("deduplicates concepts that share the same code within a value set", () => {
      const rows = [
        { ...baseRow, code: "1", display: "One", include: true },
        { ...baseRow, code: "1", display: "One duplicate", include: true },
        { ...baseRow, code: "2", display: "Two", include: true },
      ];

      const [vs] = groupConditionConceptsIntoValueSets(rows);

      expect(vs.concepts.map((c) => c.code)).toEqual(["1", "2"]);
    });

    it("marks includeValueSet false only when every concept is explicitly excluded", () => {
      const allExcluded = [
        { ...baseRow, valueSetId: "excluded", code: "1", include: false },
        { ...baseRow, valueSetId: "excluded", code: "2", include: false },
      ];
      const [excludedVs] = groupConditionConceptsIntoValueSets(allExcluded);
      expect(excludedVs.includeValueSet).toBe(false);

      const someIncluded = [
        { ...baseRow, valueSetId: "mixed", code: "1", include: false },
        { ...baseRow, valueSetId: "mixed", code: "2", include: true },
      ];
      const [mixedVs] = groupConditionConceptsIntoValueSets(someIncluded);
      expect(mixedVs.includeValueSet).toBe(true);

      // Undefined inclusion still defaults to included.
      const undefinedInclude = [{ ...baseRow, valueSetId: "undef", code: "1" }];
      const [undefinedVs] =
        groupConditionConceptsIntoValueSets(undefinedInclude);
      expect(undefinedVs.includeValueSet).toBe(true);
      expect(undefinedVs.concepts[0].include).toBe(true);
    });

    it("sets userCreated true for the customCondition condition id", () => {
      const rows = [
        {
          ...baseRow,
          valueSetId: "custom",
          code: "1",
          include: true,
          conditionId: "customCondition",
        },
      ];

      const [vs] = groupConditionConceptsIntoValueSets(rows);

      expect(vs.conditionId).toBe("customCondition");
      expect(vs.userCreated).toBe(true);
    });

    it("defaults optional fields and drops concepts with null codes", () => {
      const rows = [
        {
          valueSetId: "sparse",
          version: "2024",
          valueSetName: "Sparse VS",
          author: "DIBBs",
          codeSystem: "http://loinc.org",
          dibbsConceptType: "labs",
          code: "1",
          display: "Real concept",
          include: true,
        },
        {
          valueSetId: "sparse",
          version: "2024",
          valueSetName: "Sparse VS",
          author: "DIBBs",
          codeSystem: "http://loinc.org",
          dibbsConceptType: "labs",
          code: null,
          display: "Empty concept",
        },
      ];

      const [vs] = groupConditionConceptsIntoValueSets(rows);

      expect(vs.valueSetExternalId).toBeUndefined();
      expect(vs.ersdConceptType).toBeUndefined();
      expect(vs.userCreated).toBe(false);
      expect(vs.conditionId).toBeUndefined();
      // The null-coded concept is filtered out.
      expect(vs.concepts).toHaveLength(1);
      expect(vs.concepts[0].code).toBe("1");
    });
  });
});
