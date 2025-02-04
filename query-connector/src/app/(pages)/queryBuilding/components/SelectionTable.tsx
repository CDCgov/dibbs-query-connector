"use client";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import { HeadingLevel } from "@trussworks/react-uswds";
import ConceptTypeAccordionBody, {
  filterConceptsBySearchFilter,
} from "./SelectionViewAccordionBody";
import {
  Concept,
  DibbsConceptType,
  DibbsValueSet,
} from "@/app/shared/constants";
import {
  ConceptTypeToDibbsVsMap,
  ConceptTypeToFilterableDibbsVsMap,
} from "@/app/utils/valueSetTranslation";
import ConceptTypeAccordionHeader from "./SelectionViewAccordionHeader";
import MultiAccordion from "@/app/ui/designSystem/MultiAccordion";
import { EMPTY_CONCEPT_TYPE } from "../utils";

type ConceptTypeSelectionTableProps = {
  vsTypeLevelOptions: ConceptTypeToDibbsVsMap;
  handleVsTypeLevelUpdate: (
    vsType: DibbsConceptType,
  ) => (vsId: string) => (dibbsValueSets: DibbsValueSet) => void;
  searchFilter: string;
  setSearchFilter: Dispatch<SetStateAction<string>>;
};

type VsTypeAccordion = {
  title: JSX.Element;
  content: JSX.Element;
  expanded: boolean;
  id: string;
  headingLevel: "h4";
  handleToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
  atLeastOneRenderedValueSet: boolean;
};

type ValueSetWithRender = {
  render: boolean;
  concepts: FilterableConcept[];
};

export type FilterableConcept = Concept & {
  render: boolean;
};

export type FilterableValueSet = Omit<DibbsValueSet, "concepts"> &
  ValueSetWithRender;

/**
 * Component that displays ValueSetGroupings sorted by VsType (DibbsConceptType)
 * for the active condition selected
 * @param root0 - params
 * @param root0.searchFilter - the string set in the search field to filter options by
 * @param root0.vsTypeLevelOptions - the valueSets that are currently in the in-progress query
 * @param root0.handleVsTypeLevelUpdate - curried state update function that
 * takes a VsType and generates a VsName level setter function
 * @returns A component for display to render on the query building page
 */
export const ConceptTypeSelectionTable: React.FC<
  ConceptTypeSelectionTableProps
> = ({ vsTypeLevelOptions, handleVsTypeLevelUpdate, searchFilter }) => {
  const [curExpanded, setCurExpanded] = useState<string>("");
  const [accordionItems, setAccordionItems] = useState<VsTypeAccordion[]>([]);

  useEffect(() => {
    setAccordionItems(
      generateTypeLevelAccordionItems(vsTypeLevelOptions, searchFilter),
    );
  }, [vsTypeLevelOptions, searchFilter, curExpanded]);

  const generateTypeLevelAccordionItems = (
    vsTypeLevelOptions:
      | ConceptTypeToFilterableDibbsVsMap
      | ConceptTypeToDibbsVsMap,
    searchFilter: string,
  ) => {
    const accordionDataToDisplay = filterVsTypeOptions(
      vsTypeLevelOptions,
      searchFilter,
    );
    const areItemsFiltered = searchFilter !== "";

    return Object.entries(accordionDataToDisplay).map(
      ([k, valueSetsInType]) => {
        const atLeastOneRenderedValueSet = Object.values(valueSetsInType)
          .map((vs) => vs.render)
          .flat()
          .some(Boolean);

        const vsType = k as DibbsConceptType;
        const handleVsNameLevelUpdate = handleVsTypeLevelUpdate(vsType);

        const title = (
          <ConceptTypeAccordionHeader
            activeType={vsType}
            activeTypeValueSets={valueSetsInType}
            expanded={curExpanded === vsType}
            handleVsNameLevelUpdate={handleVsNameLevelUpdate}
            areItemsFiltered={areItemsFiltered}
          />
        );

        const content = (
          <ConceptTypeAccordionBody
            activeValueSets={valueSetsInType}
            handleVsIdLevelUpdate={handleVsNameLevelUpdate}
            tableSearchFilter={searchFilter}
          />
        );
        const level: HeadingLevel = "h4";

        const handleToggle = () => {
          setCurExpanded(vsType);
        };

        return {
          title,
          content,
          expanded: false,
          id: `${vsType}`,
          headingLevel: level,
          handleToggle,
          atLeastOneRenderedValueSet,
        };
      },
    );
  };

  const accordionsToRender = accordionItems.filter(
    (i) => i.atLeastOneRenderedValueSet,
  );

  return (
    <div data-testid="accordion" className={styles.accordionContainer}>
      {accordionsToRender.length > 0 ? (
        <MultiAccordion
          items={accordionsToRender}
          multiselectable={false}
          accordionClassName={styles.accordionInnerWrapper}
        />
      ) : (
        <div className="padding-2">
          <strong>No valuesets found</strong>
        </div>
      )}
    </div>
  );
};

/**
 * A helper function to filter a v
 * @param searchFilter - the search string to filter against
 * @param vs - the valueset to filter
 * @returns a valueset with the appropriate render flags set for itself/its concepts
 */
export function filterValueSet(searchFilter: string, vs: DibbsValueSet) {
  let vsNameMatch = vs.valueSetName.toLocaleLowerCase().includes(searchFilter);
  const conceptMatches = filterConceptsBySearchFilter(searchFilter, vs);
  const curValueSet = {
    ...vs,
    render:
      // render a valueset if there's a match on the name or if there's a match
      // on any of its concepts
      vsNameMatch || conceptMatches.map((c) => c.render).some(Boolean),
  } as FilterableValueSet;
  curValueSet.concepts = conceptMatches;
  return curValueSet;
}

function filterVsTypeOptions(
  vsTypeLevelOptions: ConceptTypeToDibbsVsMap,
  searchFilter: string,
) {
  const casedSearchFilter = searchFilter.toLocaleLowerCase();
  const filteredValueSets: {
    [conceptType in DibbsConceptType]: {
      [vsId: string]: FilterableValueSet;
    };
  } = structuredClone(EMPTY_CONCEPT_TYPE);

  Object.entries(vsTypeLevelOptions).forEach(([vsType, vsDict]) => {
    const curVsType = vsType as DibbsConceptType;
    Object.entries(vsDict).forEach(([vsId, vs]) => {
      // initialize the filterable concepts and value sets
      const curValueSet = filterValueSet(casedSearchFilter, vs);
      filteredValueSets[curVsType][vsId] = curValueSet;
    });
  });

  return filteredValueSets;
}
