"use client";
import { useState } from "react";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import {
  HeadingLevel,
  Accordion as TrussAccordion,
} from "@trussworks/react-uswds";
import SelectionViewAccordionBody from "./SelectionViewAccordionBody";
import { DibbsConceptType, DibbsValueSet } from "@/app/constants";
import {
  ConceptTypeToVsNameToVsGroupingMap,
  VsGrouping,
} from "@/app/utils/valueSetTranslation";
import SelectionViewAccordionHeader from "./SelectionViewAccordionHeader";

type SelectionTableProps = {
  vsTypeLevelOptions: ConceptTypeToVsNameToVsGroupingMap;
  handleVsTypeLevelUpdate: (
    vsType: DibbsConceptType,
  ) => (
    vsName: string,
  ) => (val: VsGrouping) => (dibbsValueSets: DibbsValueSet[]) => void;
};

/**
 * Detail display component for a condition on the query building page
 * @param root0 - params
 * @param root0.conditionId - The ID of the active condition, whose associated value sets
 * @param root0.vsTypeLevelOptions - the valueSets that are currently in the in-progress query
 * @param root0.setValueSets - State function that updates the value set data for the selected condition
 * @param root0.handleVsTypeLevelUpdate
 * @returns A component for display to render on the query building page
 */
export const SelectionTable: React.FC<SelectionTableProps> = ({
  vsTypeLevelOptions,
  handleVsTypeLevelUpdate,
}) => {
  const [expanded, setExpandedGroup] = useState<string>("");

  const generateTypeLevelAccordionItems = (vsType: DibbsConceptType) => {
    const handleVsNameLevelUpdate = handleVsTypeLevelUpdate(vsType);

    const title = (
      <SelectionViewAccordionHeader
        activeValueSetType={vsType}
        activeVsGroupings={vsTypeLevelOptions[vsType]}
        expanded={expanded === vsType}
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

    const handleToggle = () => {
      setExpandedGroup((prevState) => {
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
    };
  };
  return (
    <div data-testid="accordion" className={styles.accordionContainer}>
      <TrussAccordion
        items={Object.keys(vsTypeLevelOptions).map((vsType) => {
          return generateTypeLevelAccordionItems(vsType as DibbsConceptType);
        })}
        multiselectable={false}
        className={styles.accordionInnerWrapper}
      />
    </div>
  );
};
