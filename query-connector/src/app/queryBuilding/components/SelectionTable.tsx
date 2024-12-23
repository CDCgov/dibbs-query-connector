"use client";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import {
  ConditionToConceptTypeToValueSetGroupingMap,
  batchToggleConcepts,
} from "../utils";
import {
  HeadingLevel,
  Accordion as TrussAccordion,
} from "@trussworks/react-uswds";
import SelectionViewAccordionBody from "./SelectionViewAccordionBody";
import { DibbsConceptType } from "@/app/constants";
import {
  ConceptTypeToVsNameToVsGroupingMap,
  VsGrouping,
} from "@/app/utils/valueSetTranslation";
import SelectionViewAccordionHeader from "./SelectionViewAccordionHeader";

type SelectionTableProps = {
  vsTypeLevelOptions: ConceptTypeToVsNameToVsGroupingMap;
  handleVsTypeLevelUpdate: (
    vsType: DibbsConceptType,
  ) => (vsName: string) => (val: VsGrouping) => void;
};

/**
 * Detail display component for a condition on the query building page
 * @param root0 - params
 * @param root0.conditionId - The ID of the active condition, whose associated value sets
 * @param root0.vsTypeLevelOptions - the valueSets that are currently in the in-progress query
 * @param root0.setValueSets - State function that updates the value set data for the selected condition
 * @returns A component for display to render on the query building page
 */
export const SelectionTable: React.FC<SelectionTableProps> = ({
  vsTypeLevelOptions,
  handleVsTypeLevelUpdate,
}) => {
  console.log(vsTypeLevelOptions);
  const [expanded, setExpandedGroup] = useState<string>("");
  const generateTypeLevelAccordionItems = (vsType: DibbsConceptType) => {
    const handleVsNameLevelUpdate = handleVsTypeLevelUpdate(vsType);

    const title = (
      <SelectionViewAccordionHeader
        activeValueSetType={vsType}
        activeVsGroupings={vsTypeLevelOptions[vsType]}
        expanded={false}
        handleVsNameLevelUpdate={handleVsNameLevelUpdate}
      />
    );

    const content = (
      <SelectionViewAccordionBody
        activeVsGroupings={vsTypeLevelOptions[vsType]}
        handleVsNameLevelUpdate={handleVsNameLevelUpdate}
      />
    );
    const level: HeadingLevel = "h4";

    const handleToggle = (e: React.MouseEvent) => {
      const element = e.currentTarget.getAttribute("data-testid");
      const startIndex = element?.indexOf(vsType) || 0;
      const endIndex = vsType.length + startIndex;

      if (expanded === vsType) {
        // if the group we clicked on is currently expanded,
        // toggle it closed
        setExpandedGroup("");
      } else {
        // otherwise, expand the thing we clicked on
        setExpandedGroup(element?.slice(startIndex, endIndex) || "");
      }
    };

    return {
      title,
      content,
      expanded: false,
      id: `${vsType}`,
      headingLevel: level,
      handleToggle,
    };
  };

  const accordionItems = Object.keys(vsTypeLevelOptions).map((vsType) => {
    return (
      <div data-testid="accordion" className={styles.accordionContainer}>
        <TrussAccordion
          items={[generateTypeLevelAccordionItems(vsType as DibbsConceptType)]}
          multiselectable={false}
          className={styles.accordionInnerWrapper}
        />
      </div>
    );
  });

  return accordionItems;
};
