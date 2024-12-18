import React from "react";
import { render, screen } from "@testing-library/react";
import {
  groupConditionConceptsIntoValueSets,
  unnestValueSetsFromQuery,
} from "../../utils";

import {
  groupConditionDataByCategoryName,
  filterSearchByCategoryAndCondition,
} from "@/app/queryBuilding/utils";
import {
  CANCER_VALUESETS,
  CATEGORY_TO_CONDITION_ARRAY_MAP,
  DEFAULT_CHLAMYDIA_QUERY,
  EXPECTED_CHLAMYDIA_VALUESET_LENGTH,
} from "./fixtures";
import { DataDisplayInfo, DataDisplay } from "@/app/DataProvider";

describe("DataDisplay Component", () => {
  it("should render the title and value", () => {
    const item: DataDisplayInfo = {
      title: "Test Title",
      value: "Test Value",
    };

    render(<DataDisplay item={item} />);

    // Check if title is rendered
    expect(screen.getByText("Test Title")).toBeInTheDocument();

    // Check if value is rendered
    expect(screen.getByText("Test Value")).toBeInTheDocument();
  });

  it("should apply the provided className", () => {
    const item: DataDisplayInfo = {
      title: "Test Title",
      value: "Test Value",
    };
    const className = "custom-class";

    render(<DataDisplay item={item} className={className} />);

    // Check if the className is applied to the inner container
    expect(screen.getByText("Test Value")).toHaveClass("custom-class");
    expect(screen.getByText("Test Value").parentElement).toHaveClass(
      "grid-row",
    );
  });

  it("should render React elements as value", () => {
    const item: DataDisplayInfo = {
      title: "Test Title",
      value: <span data-testid="custom-element">Custom Element</span>,
    };

    render(<DataDisplay item={item} />);

    // Check if the custom React element is rendered
    expect(screen.getByTestId("custom-element")).toBeInTheDocument();
  });

  it("should render an array of React elements as value", () => {
    const item: DataDisplayInfo = {
      title: "Test Title",
      value: [
        <span key="1" data-testid="element-1">
          Element 1
        </span>,
        <span key="2" data-testid="element-2">
          Element 2
        </span>,
      ],
    };

    render(<DataDisplay item={item} />);

    // Check if the array of React elements is rendered
    expect(screen.getByTestId("element-1")).toBeInTheDocument();
    expect(screen.getByTestId("element-2")).toBeInTheDocument();
  });
});

describe("data util methods for query building", () => {
  describe("groupConditionDataByCategoryName", () => {
    it("translates backend query to frontend dictionary structure", () => {
      const mappedExample = groupConditionDataByCategoryName(
        CATEGORY_TO_CONDITION_ARRAY_MAP,
      );
      // check a couple of random values to make sure mapping works correctly
      expect(mappedExample["Injuries, NEC"][44301001].name).toBe(
        "Suicide (event)",
      );
      expect(mappedExample["Injuries, NEC"][44301001].include).toBe(false);
      expect(mappedExample["Vaccine Preventable Diseases"][6142004].name).toBe(
        "Influenza (disorder)",
      );
      expect(
        mappedExample["Vaccine Preventable Diseases"][6142004].include,
      ).toBe(false);
    });
  });

  describe("filterSearchByCategoryAndCondition", () => {
    it("filters by category (parent level)", () => {
      const frontendStructuredData = groupConditionDataByCategoryName(
        CATEGORY_TO_CONDITION_ARRAY_MAP,
      );
      const filterResults = filterSearchByCategoryAndCondition(
        "Diseases",
        frontendStructuredData,
      );

      expect(Object.values(filterResults).length).toBe(9);
    });
    it("filters by condition (child level)", () => {
      const frontendStructuredData = groupConditionDataByCategoryName(
        CATEGORY_TO_CONDITION_ARRAY_MAP,
      );
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

  describe("unnestValueSetsFromQuery", () => {
    const unnestedVals = unnestValueSetsFromQuery(DEFAULT_CHLAMYDIA_QUERY);
    expect(unnestedVals.length).toBe(EXPECTED_CHLAMYDIA_VALUESET_LENGTH);
  });

  describe("groupConditionConceptsByValueSetId", () => {
    const formattedValueSets =
      groupConditionConceptsIntoValueSets(CANCER_VALUESETS);
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
