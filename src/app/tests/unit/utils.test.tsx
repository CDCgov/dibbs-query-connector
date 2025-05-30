import { groupConditionConceptsIntoValueSets } from "../../shared/utils";

import { filterSearchByCategoryAndCondition } from "@/app/(pages)/queryBuilding/utils";
import {
  CANCER_DB_QUERY_VALUES,
  CATEGORY_TO_CONDITION_ARRAY_MAP,
} from "./fixtures";

describe("data util methods for query building", () => {
  describe("filterSearchByCategoryAndCondition", () => {
    it("filters by category (parent level)", () => {
      const frontendStructuredData = CATEGORY_TO_CONDITION_ARRAY_MAP;
      const filterResults = filterSearchByCategoryAndCondition(
        "Diseases",
        frontendStructuredData,
      );

      expect(Object.values(filterResults).length).toBe(9);
    });
    it("filters by condition (child level)", () => {
      const frontendStructuredData = CATEGORY_TO_CONDITION_ARRAY_MAP;
      const filterResults = filterSearchByCategoryAndCondition(
        "hepatitis",
        frontendStructuredData,
      );

      // String with hepatitis exists in two categories
      expect(Object.values(filterResults).length).toBe(2);
      // ... with 9 individual conditions
      const countOfResults = Object.values(
        Object.values(filterResults),
      ).flatMap((e) => Object.values(e).length);
      expect(countOfResults[0] + countOfResults[1]).toBe(8);
    });
  });

  describe("groupConditionConceptsByValueSetId", () => {
    const formattedValueSets = groupConditionConceptsIntoValueSets(
      CANCER_DB_QUERY_VALUES,
    );
    const EXPECTED_CANCER_VALUESET_GROUPS = 4;
    expect(formattedValueSets.length).toBe(EXPECTED_CANCER_VALUESET_GROUPS);
    expect(
      formattedValueSets.find((v) => v.valueSetId === "14_20240923")?.concepts
        .length,
    ).toBe(3);
    expect(
      formattedValueSets.find((v) => v.valueSetId === "2_20240909")?.concepts
        .length,
    ).toBe(5);

    expect(
      formattedValueSets
        .find((v) => v.valueSetId === "2_20240909")
        ?.concepts.every((v) => Boolean(v)),
    ).toBeTrue();
  });
});
