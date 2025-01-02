import { DibbsValueSet } from "../constants";
import { CANCER_DB_QUERY_VALUES } from "../tests/unit/fixtures";
import { groupConditionConceptsIntoValueSets } from "../utils";
import {
  generateValueSetGroupingsByDibbsConceptType,
  groupValueSetGroupingByConditionId,
  groupValueSetsByConceptType,
  groupValueSetsByNameAuthorSystem,
} from "./valueSetTranslation";

describe("translation utils", () => {
  let cancerSets: DibbsValueSet[] = groupConditionConceptsIntoValueSets(
    CANCER_DB_QUERY_VALUES,
  );

  const CANCER_CONDITION_ID = "2";

  describe("groupValueSetsByNameAuthorSystem", () => {
    it("returns expected grouped valueset", () => {
      const groupedValueSets = groupValueSetsByNameAuthorSystem(cancerSets);
      expect(Object.keys(groupedValueSets).length).toBe(4);
      expect(
        Object.values(groupedValueSets).map((v) => v.valueSetName),
      ).toInclude("Cancer (Leukemia) Lab Result");
      expect(
        Object.values(groupedValueSets).map((v) => v.valueSetName),
      ).toInclude("Cancer (Leukemia) Diagnosis Problem");
      expect(
        Object.values(groupedValueSets).map((v) => v.valueSetName),
      ).toInclude("Cancer (Leukemia) Medication");
      expect(
        Object.values(groupedValueSets).map((v) => v.valueSetName),
      ).toInclude("Suspected Cancer (Leukemia) Diagnosis");
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
  describe("groupValueSetGroupingByConditionId", () => {
    const parentMap = groupValueSetGroupingByConditionId({
      [CANCER_CONDITION_ID]: cancerSets,
    });

    const expectedGrouping =
      generateValueSetGroupingsByDibbsConceptType(cancerSets);

    expect(parentMap[CANCER_CONDITION_ID]).toEqual(expectedGrouping);
  });

  describe("groupValueSetsByConceptType", () => {
    it("returns the expected DibbsValueSet arrays for each of the concept types", () => {
      const groupedValueSets = groupValueSetsByConceptType(cancerSets);

      expect(groupedValueSets["labs"].length).toBe(1);
      expect(groupedValueSets["conditions"].length).toBe(2);
      expect(groupedValueSets["medications"].length).toBe(1);
    });
  });
});
