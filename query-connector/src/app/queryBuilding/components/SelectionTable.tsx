"use client";
import { useState } from "react";
import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import { HeadingLevel } from "@trussworks/react-uswds";
import ConceptTypeAccordionBody from "./SelectionViewAccordionBody";
import { DibbsConceptType, DibbsValueSet } from "@/app/constants";
import { ConceptTypeToDibbsVsMap } from "@/app/utils/valueSetTranslation";
import ConceptTypeAccordionHeader from "./SelectionViewAccordionHeader";
import MultiAccordion from "@/app/query/designSystem/MultiAccordion";

type ConceptTypeSelectionTableProps = {
  vsTypeLevelOptions: ConceptTypeToDibbsVsMap;
  handleVsTypeLevelUpdate: (
    vsType: DibbsConceptType,
  ) => (vsId: string) => (dibbsValueSets: DibbsValueSet) => void;
};
/**
 * Component that displays ValueSetGroupings sorted by VsType (DibbsConceptType)
 * for the active condition selected
 * @param root0 - params
 * @param root0.vsTypeLevelOptions - the valueSets that are currently in the in-progress query
 * @param root0.handleVsTypeLevelUpdate - curried state update function that
 * takes a VsType and generates a VsName level setter function
 * @returns A component for display to render on the query building page
 */
export const ConceptTypeSelectionTable: React.FC<
  ConceptTypeSelectionTableProps
> = ({ vsTypeLevelOptions, handleVsTypeLevelUpdate }) => {
  const [expanded, setExpandedGroup] = useState<string>("");
  const generateTypeLevelAccordionItems = (vsType: DibbsConceptType) => {
    const handleVsNameLevelUpdate = handleVsTypeLevelUpdate(vsType);

    const title = (
      <ConceptTypeAccordionHeader
        activeType={vsType}
        activeTypeValueSets={vsTypeLevelOptions[vsType]}
        expanded={expanded === vsType}
        handleVsNameLevelUpdate={handleVsNameLevelUpdate}
      />
    );

    const content = (
      <ConceptTypeAccordionBody
        activeValueSets={vsTypeLevelOptions[vsType]}
        handleVsIdLevelUpdate={handleVsNameLevelUpdate}
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
      length: Object.keys(vsTypeLevelOptions[vsType]).length,
    };
  };

  const accordionItems = Object.keys(vsTypeLevelOptions)
    .map((vsType) => {
      return generateTypeLevelAccordionItems(vsType as DibbsConceptType);
    })
    .filter((v) => v.length > 0);
  return (
    <div data-testid="accordion" className={styles.accordionContainer}>
      <MultiAccordion
        items={accordionItems}
        multiselectable={false}
        accordionClassName={styles.accordionInnerWrapper}
      />
    </div>
  );
};
