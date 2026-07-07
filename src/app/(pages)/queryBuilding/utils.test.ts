import { Concept } from "@/app/models/entities/concepts";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { CUSTOM_CONDITION_ID } from "@/app/constants";
import {
  batchToggleConcepts,
  CategoryToConditionArrayMap,
  formatCategoryDisplay,
  formatCategoryToConditionsMap,
  formatDiseaseDisplay,
  tallyConceptsForSingleValueSet,
  tallyConceptsForValueSetArray,
} from "./utils";

function makeConcept(code: string, display: string, include: boolean): Concept {
  return { code, display, include };
}

function makeValueSet(overrides: Partial<DibbsValueSet> = {}): DibbsValueSet {
  return {
    valueSetId: "vs-1",
    valueSetVersion: "1",
    valueSetName: "Test Value Set",
    author: "DIBBs",
    system: "http://snomed.info/sct",
    dibbsConceptType: "labs",
    includeValueSet: true,
    userCreated: false,
    concepts: [
      makeConcept("1", "Concept One", true),
      makeConcept("2", "Concept Two", false),
      makeConcept("3", "Concept Three", true),
    ],
    ...overrides,
  };
}

describe("formatCategoryDisplay", () => {
  it("returns the mapped display name when an override exists", () => {
    expect(formatCategoryDisplay("Sexually Transmitted Diseases")).toBe(
      "Sexually Transmitted Diseases (STI)",
    );
  });

  it("falls back to the raw name when no override exists", () => {
    expect(formatCategoryDisplay("Cancer")).toBe("Cancer");
  });
});

describe("formatDiseaseDisplay", () => {
  it("returns the mapped display name when an override exists", () => {
    expect(
      formatDiseaseDisplay("Human immunodeficiency virus infection (disorder)"),
    ).toBe("Human immunodeficiency virus infection (HIV)");
  });

  it("strips a trailing (disorder) suffix and trims whitespace", () => {
    expect(
      formatDiseaseDisplay("Malignant neoplastic disease (disorder)"),
    ).toBe("Malignant neoplastic disease");
  });

  it("returns the name unchanged when there is no (disorder) suffix", () => {
    expect(formatDiseaseDisplay("Leukemia")).toBe("Leukemia");
  });
});

describe("tallyConceptsForSingleValueSet", () => {
  it("counts every concept when filterInclude is not provided", () => {
    expect(tallyConceptsForSingleValueSet(makeValueSet())).toBe(3);
  });

  it("counts only included concepts when filterInclude is true", () => {
    expect(tallyConceptsForSingleValueSet(makeValueSet(), true)).toBe(2);
  });

  it("returns 0 for a value set with no concepts", () => {
    expect(tallyConceptsForSingleValueSet(makeValueSet({ concepts: [] }))).toBe(
      0,
    );
  });
});

describe("tallyConceptsForValueSetArray", () => {
  const valueSets = [
    makeValueSet({ valueSetId: "a" }),
    makeValueSet({
      valueSetId: "b",
      concepts: [
        makeConcept("10", "Ten", true),
        makeConcept("11", "Eleven", false),
      ],
    }),
  ];

  it("sums all concepts across value sets when filterInclude is not provided", () => {
    expect(tallyConceptsForValueSetArray(valueSets)).toBe(5);
  });

  it("sums only included concepts across value sets when filterInclude is true", () => {
    expect(tallyConceptsForValueSetArray(valueSets, true)).toBe(3);
  });

  it("returns 0 for an empty array", () => {
    expect(tallyConceptsForValueSetArray([])).toBe(0);
  });
});

describe("batchToggleConcepts", () => {
  it("flips the include flag on every concept", () => {
    const valueSet = makeValueSet({
      concepts: [
        makeConcept("1", "One", true),
        makeConcept("2", "Two", false),
        makeConcept("3", "Three", true),
      ],
    });

    const result = batchToggleConcepts(valueSet);

    expect(result.concepts.map((c) => c.include)).toEqual([false, true, false]);
  });

  it("mutates and returns the same value set instance", () => {
    const valueSet = makeValueSet();
    const result = batchToggleConcepts(valueSet);
    expect(result).toBe(valueSet);
  });
});

describe("formatCategoryToConditionsMap", () => {
  it("drops the CUSTOM_CONDITION_ID entry from a category", () => {
    const input: CategoryToConditionArrayMap = {
      Cancer: [
        { id: "2", name: "Leukemia" },
        { id: CUSTOM_CONDITION_ID, name: "Custom" },
      ],
    };

    const result = formatCategoryToConditionsMap(input);

    expect(result.Cancer).toEqual([{ id: "2", name: "Leukemia" }]);
  });

  it("drops a category that becomes empty after removing the custom condition", () => {
    const input: CategoryToConditionArrayMap = {
      OnlyCustom: [{ id: CUSTOM_CONDITION_ID, name: "Custom" }],
      Cancer: [{ id: "2", name: "Leukemia" }],
    };

    const result = formatCategoryToConditionsMap(input);

    expect(result).toEqual({ Cancer: [{ id: "2", name: "Leukemia" }] });
    expect(result).not.toHaveProperty("OnlyCustom");
  });

  it("returns an empty map for an empty input", () => {
    expect(formatCategoryToConditionsMap({})).toEqual({});
  });
});
