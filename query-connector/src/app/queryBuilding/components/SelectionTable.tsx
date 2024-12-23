"use client";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import {
  ConditionToConceptTypeToValueSetGroupingMap,
  batchToggleConcepts,
  tallyConceptsForValueSetGroup,
} from "../utils";
import {
  HeadingLevel,
  Accordion as TrussAccordion,
} from "@trussworks/react-uswds";
import SelectionViewAccordionHeader from "./SelectionViewAccordionHeader";
import SelectionViewAccordionBody from "./SelectionViewAccordionBody";
import { DibbsConceptType } from "@/app/constants";
import {
  ConceptTypeToVsNameToVsGroupingMap,
  VsGrouping,
} from "@/app/utils/valueSetTranslation";

type SelectionTableProps = {
  selectedValueSets: ConditionToConceptTypeToValueSetGroupingMap;
  conditionId: string;
  groupedValueSetsForCondition: ConceptTypeToVsNameToVsGroupingMap;
  setValueSets: Dispatch<
    SetStateAction<ConditionToConceptTypeToValueSetGroupingMap>
  >;
};

/**
 * Detail display component for a condition on the query building page
 * @param root0 - params
 * @param root0.conditionId - The ID of the active condition, whose associated value sets
 * @param root0.selectedValueSets - the valueSets that are currently in the in-progress query
 * @param root0.setValueSets - State function that updates the value set data for the selected condition
 * @returns A component for display to render on the query building page
 */
export const SelectionTable: React.FC<SelectionTableProps> = ({
  conditionId,
  selectedValueSets,
  setValueSets,
}) => {
  const groupedValueSetsForCondition = selectedValueSets[conditionId];
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
    const vsNameAuthorSystem = `${groupedValueSet.valueSetName}:${groupedValueSet.author}:${groupedValueSet.system}`;
    const updatedVS =
      groupedValueSetsForCondition[activeValueSetType][vsNameAuthorSystem];

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

    groupedValueSetsForCondition[activeValueSetType] = {
      ...groupedValueSetsForCondition[activeValueSetType],
      [vsNameAuthorSystem]: groupedValueSet,
    };

    setValueSets((prevState) => {
      prevState[conditionId][activeValueSetType][vsNameAuthorSystem] =
        updatedVS;
      return prevState;
    });
  };

  const generateAccordionItems = (types: Array<DibbsConceptType>) => {
    const typesWithContent =
      types &&
      types.filter(
        (type) => Object.values(groupedValueSetsForCondition[type]).length > 0,
      );

    const ValueSetAccordionItems =
      typesWithContent &&
      typesWithContent.map((activeValueSetType) => {
        const activeVsGroupings = Object.values(
          groupedValueSetsForCondition[activeValueSetType],
        );
        const title = (
          <SelectionViewAccordionHeader
            activeValueSetType={activeValueSetType}
            conditionId={conditionId}
            activeVsGroupings={activeVsGroupings}
            handleCheckboxToggle={handleGroupCheckboxToggle}
            expanded={expanded?.indexOf(activeValueSetType) > -1 || false}
          />
        );
        // TODO: it seems that structuring the accordion generation this way doesn't
        // rerender the accordion components on save, causing the numbers to update
        // only partially. Refactor this accordingly
        const content = (
          <SelectionViewAccordionBody
            activeValueSetType={activeValueSetType}
            activeVsGroupings={activeVsGroupings}
            setValueSets={setValueSets}
            conditionId={conditionId}
          />
        );
        const level: HeadingLevel = "h4";

        const handleToggle = (e: React.MouseEvent) => {
          const element = e.currentTarget.getAttribute("data-testid");
          const startIndex = element?.indexOf(activeValueSetType) || 0;
          const endIndex = activeValueSetType.length + startIndex;

          if (expanded == activeValueSetType) {
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
          id: `${activeValueSetType}-${conditionId}`,
          headingLevel: level,
          handleToggle,
        };
      });
    return ValueSetAccordionItems;
  };

  const types =
    groupedValueSetsForCondition &&
    (Object.keys(groupedValueSetsForCondition) as Array<DibbsConceptType>);

  const accordionItems = generateAccordionItems(types);

  return (
    accordionItems && (
      <div data-testid="accordion" className={styles.accordionContainer}>
        <TrussAccordion
          items={accordionItems}
          multiselectable={false}
          className={styles.accordionInnerWrapper}
        />
      </div>
    )
  );
};
