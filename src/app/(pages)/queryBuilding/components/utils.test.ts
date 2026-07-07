import { Concept } from "@/app/models/entities/concepts";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { ConceptTypeToDibbsVsMap } from "@/app/utils/valueSetTranslation";
import {
  filterConcepts,
  filterValueSet,
  filterVsTypeOptions,
  FilterableConcept,
} from "./utils";

function makeConcept(code: string, display: string, include = true): Concept {
  return { code, display, include };
}

function makeValueSet(overrides: Partial<DibbsValueSet> = {}): DibbsValueSet {
  return {
    valueSetId: "vs-1",
    valueSetVersion: "1",
    valueSetName: "Cancer Leukemia Labs",
    author: "DIBBs",
    system: "http://snomed.info/sct",
    dibbsConceptType: "labs",
    includeValueSet: true,
    userCreated: false,
    concepts: [
      makeConcept("1234", "White blood cell count"),
      makeConcept("5678", "Hemoglobin measurement"),
    ],
    ...overrides,
  };
}

describe("filterConcepts", () => {
  it("renders every concept when the value set name matches (matchOnValueSetName true)", () => {
    const result = filterConcepts("leukemia", makeValueSet());
    expect(result.map((c) => c.render)).toEqual([true, true]);
  });

  it("renders only concepts whose code or display matches when the name does not match", () => {
    const result = filterConcepts("hemoglobin", makeValueSet());
    expect(result.map((c) => c.render)).toEqual([false, true]);
  });

  it("matches on concept code", () => {
    const result = filterConcepts("1234", makeValueSet());
    expect(result.map((c) => c.render)).toEqual([true, false]);
  });

  it("ignores the value set name when matchOnValueSetName is false", () => {
    // "leukemia" only appears in the name, so no concept should render
    const result = filterConcepts("leukemia", makeValueSet(), false);
    expect(result.map((c) => c.render)).toEqual([false, false]);
  });

  it("skips concepts already marked render:false when matchOnValueSetName is false", () => {
    const preFiltered: FilterableConcept[] = [
      { ...makeConcept("1234", "White blood cell count"), render: false },
      { ...makeConcept("5678", "Hemoglobin measurement"), render: true },
    ];
    const vs = {
      ...makeValueSet(),
      concepts: preFiltered,
    } as unknown as DibbsValueSet;

    const result = filterConcepts("white", vs, false);
    // first concept keeps render:false (skipped), second re-evaluated to false
    expect(result.map((c) => c.render)).toEqual([false, false]);
  });
});

describe("filterValueSet", () => {
  it("marks the value set to render and keeps concepts when the name matches", () => {
    const result = filterValueSet("cancer", makeValueSet());
    expect(result.render).toBe(true);
    expect(result.concepts.map((c) => c.render)).toEqual([true, true]);
  });

  it("marks the value set to render when only a concept matches", () => {
    const result = filterValueSet("hemoglobin", makeValueSet());
    expect(result.render).toBe(true);
    expect(result.concepts.map((c) => c.render)).toEqual([false, true]);
  });

  it("marks the value set not to render when nothing matches", () => {
    const result = filterValueSet("nonexistent", makeValueSet());
    expect(result.render).toBe(false);
    expect(result.concepts.map((c) => c.render)).toEqual([false, false]);
  });
});

describe("filterVsTypeOptions", () => {
  function makeOptions(): ConceptTypeToDibbsVsMap {
    return {
      labs: {
        "lab-1": makeValueSet({
          valueSetId: "lab-1",
          valueSetName: "Cancer Leukemia Labs",
          dibbsConceptType: "labs",
          concepts: [makeConcept("1234", "White blood cell count")],
        }),
      },
      conditions: {
        "cond-1": makeValueSet({
          valueSetId: "cond-1",
          valueSetName: "Diabetes Diagnosis",
          dibbsConceptType: "conditions",
          concepts: [makeConcept("9999", "Type 2 diabetes")],
        }),
      },
      medications: {},
    };
  }

  it("returns a filterable map keyed by concept type and value set id", () => {
    const result = filterVsTypeOptions(makeOptions(), "cancer");

    expect(Object.keys(result)).toEqual(
      expect.arrayContaining(["labs", "conditions", "medications"]),
    );
    expect(result.labs["lab-1"].render).toBe(true);
    expect(result.conditions["cond-1"].render).toBe(false);
    expect(result.medications).toEqual({});
  });

  it("sets render flags on the nested concepts of each value set", () => {
    const result = filterVsTypeOptions(makeOptions(), "diabetes");

    expect(result.labs["lab-1"].render).toBe(false);
    expect(result.conditions["cond-1"].render).toBe(true);
    expect(result.conditions["cond-1"].concepts.map((c) => c.render)).toEqual([
      true,
    ]);
  });

  it("is case-insensitive on the search filter", () => {
    const result = filterVsTypeOptions(makeOptions(), "CANCER");
    expect(result.labs["lab-1"].render).toBe(true);
  });
});
