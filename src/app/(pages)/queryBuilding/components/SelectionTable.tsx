"use client";
import { Dispatch, JSX, SetStateAction, useEffect, useState } from "react";
import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import { HeadingLevel } from "@trussworks/react-uswds";
import ConceptTypeAccordionBody from "./SelectionViewAccordionBody";
import { ConceptTypeToDibbsVsMap } from "@/app/utils/valueSetTranslation";
import ConceptTypeAccordionHeader from "./SelectionViewAccordionHeader";
import MultiAccordion from "@/app/ui/designSystem/MultiAccordion";
import { filterVsTypeOptions } from "./utils";
import {
  DibbsConceptType,
  DibbsValueSet,
} from "@/app/models/entities/valuesets";

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
  headingLevel: HeadingLevel;
  handleToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
  atLeastOneRenderedValueSet: boolean;
};

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
    vsTypeLevelOptions: ConceptTypeToDibbsVsMap,
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
        const level: HeadingLevel = "h2";

        const handleToggle = () => {
          setCurExpanded((prevState) => {
            if (prevState === vsType) return "";
            return vsType;
          });
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

  return accordionsToRender.length > 0 ? (
    <div
      data-testid="accordion-container"
      className={styles.accordionContainer}
    >
      <MultiAccordion
        items={accordionsToRender}
        multiselectable={false}
        accordionClassName={styles.accordionInnerWrapper}
      />
    </div>
  ) : null;
};
