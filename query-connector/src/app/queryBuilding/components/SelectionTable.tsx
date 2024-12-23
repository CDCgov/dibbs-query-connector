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
  const [expanded, setExpandedGroup] = useState<string>("");

  const handleGroupCheckboxToggle = (
    activeValueSetType: DibbsConceptType,
    groupedValueSets: VsGrouping[],
    isBatchUpdate: boolean,
    currentCheckboxStatus?: boolean,
  ) => {
    groupedValueSets.forEach((vs) => {
      handleSingleCheckboxToggle(
        activeValueSetType,
        vs,
        isBatchUpdate,
        !currentCheckboxStatus,
      );
    });
  };

  const handleSingleCheckboxToggle = (
    activeValueSetType: DibbsConceptType,
    groupedValueSet: VsGrouping,
    isBatchUpdate: boolean = false,
    batchValue?: boolean,
  ) => {
    const handleVsNameLevelUpdate = handleVsTypeLevelUpdate(activeValueSetType);
    const vsNameAuthorSystem = `${groupedValueSet.valueSetName}:${groupedValueSet.author}:${groupedValueSet.system}`;
    const updatedVS =
      vsTypeLevelOptions[activeValueSetType][vsNameAuthorSystem];

    if (isBatchUpdate && batchValue !== undefined) {
      groupedValueSet.items = Object.values(updatedVS.items).map((vs) => {
        vs.includeValueSet = batchValue;
        vs.concepts.forEach((concept) => {
          concept.include = batchValue;
        });
        return vs;
      });
    } else {
      groupedValueSet.items = Object.values(updatedVS.items).map((vs) => {
        batchToggleConcepts(vs);
        vs.includeValueSet = !vs.includeValueSet;
        return vs;
      });
    }

    handleVsNameLevelUpdate(vsNameAuthorSystem);
  };

  const generateAccordionItems = (activeVsType: DibbsConceptType) => {
    // const activeVsType = vsType as DibbsConceptType;
    // const activeVsGroupings = Object.values(vsGroupingDict);
    const handleVsNameLevelUpdate = handleVsTypeLevelUpdate(activeVsType);

    const title = (
      <>{activeVsType}</>
      // <SelectionViewAccordionHeader
      //   activeValueSetType={activeVsType}
      //   activeVsGroupings={vsTypeLevelOptions[activeVsType]}
      //   handleCheckboxToggle={handleGroupCheckboxToggle}
      //   expanded={expanded?.indexOf(activeVsType) > -1 || false}
      // />
    );

    const content = (
      <SelectionViewAccordionBody
        activeVsGroupings={vsTypeLevelOptions[activeVsType]}
        handleVsNameLevelUpdate={handleVsNameLevelUpdate}
      />
    );
    const level: HeadingLevel = "h4";

    const handleToggle = (e: React.MouseEvent) => {
      const element = e.currentTarget.getAttribute("data-testid");
      const startIndex = element?.indexOf(activeVsType) || 0;
      const endIndex = activeVsType.length + startIndex;

      if (expanded === activeVsType) {
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
      id: `${activeVsType}`,
      headingLevel: level,
      handleToggle,
    };
  };

  return Object.keys(vsTypeLevelOptions).map((vsType) => {
    return (
      <div data-testid="accordion" className={styles.accordionContainer}>
        <TrussAccordion
          items={[generateAccordionItems(vsType as DibbsConceptType)]}
          multiselectable={false}
          className={styles.accordionInnerWrapper}
        />
      </div>
    );
  });
};
