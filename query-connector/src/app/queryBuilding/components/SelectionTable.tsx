"use client";
import { Dispatch, SetStateAction, useState } from "react";
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
 * and concepts are shown in the table
 * @param root0.groupedValueSetsForCondition - Value Sets for the active condition, organized by
 * type (conditions, labs, medications)
 * @param root0.setValueSets - State function that updates the value set data for the selected condition
 * @returns A component for display to render on the query building page
 */
export const SelectionTable: React.FC<SelectionTableProps> = ({
  conditionId,
  groupedValueSetsForCondition,
  setValueSets,
}) => {
  const [expanded, setExpandedGroup] = useState<string>("");

  const handleGroupCheckboxToggle = (
    activeConceptType: DibbsConceptType,
    groupedValueSets: VsGrouping[],
    isBatchUpdate: boolean,
    currentCheckboxStatus?: boolean,
  ) => {
    groupedValueSets.forEach((vs) => {
      handleSingleCheckboxToggle(
        activeConceptType,
        vs,
        isBatchUpdate,
        !currentCheckboxStatus,
      );
    });
  };

  const handleSingleCheckboxToggle = (
    activeConceptType: DibbsConceptType,
    groupedValueSet: VsGrouping,
    isBatchUpdate: boolean = false,
    batchValue?: boolean,
  ) => {
    const key = `${groupedValueSet.valueSetName}:${groupedValueSet.author}:${groupedValueSet.system}`;
    const updatedVS = groupedValueSetsForCondition[activeConceptType][key];

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

    groupedValueSetsForCondition[activeConceptType] = {
      ...groupedValueSetsForCondition[activeConceptType],
      [key]: groupedValueSet,
    };

    setValueSets((prevState) => {
      return {
        ...prevState,
        [conditionId]: {
          ...prevState?.[conditionId],
          [activeConceptType]: {
            ...prevState?.[conditionId]?.[activeConceptType],
            [key]: updatedVS,
          },
        },
      };
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
      typesWithContent.map((activeConceptType) => {
        const actievVsGroupings = Object.values(
          groupedValueSetsForCondition[activeConceptType],
        );
        const totalCount = tallyConceptsForValueSetGroup(
          actievVsGroupings,
          false,
        );
        const selectedCount = tallyConceptsForValueSetGroup(
          actievVsGroupings,
          true,
        );

        const title = (
          <SelectionViewAccordionHeader
            activeConceptType={activeConceptType}
            conditionId={conditionId}
            totalCount={totalCount}
            selectedCount={selectedCount}
            activeVsGroupings={actievVsGroupings}
            handleCheckboxToggle={handleGroupCheckboxToggle}
            expanded={expanded?.indexOf(activeConceptType) > -1 || false}
          />
        );
        const content = (
          <SelectionViewAccordionBody
            activeConceptType={activeConceptType}
            handleCheckboxToggle={handleSingleCheckboxToggle}
            activeVsGroupings={actievVsGroupings}
          />
        );
        const level: HeadingLevel = "h4";

        const handleToggle = (e: React.MouseEvent) => {
          const element = e.currentTarget.getAttribute("data-testid");
          const startIndex = element?.indexOf(activeConceptType) || 0;
          const endIndex = activeConceptType.length + startIndex;

          if (expanded == activeConceptType) {
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
          id: `${activeConceptType}-${conditionId}`,
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
