"use client";
import { Dispatch, SetStateAction, useState } from "react";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import {
  ValueSetsByConceptType,
  batchToggleConcepts,
  ConditionToValueSetGroupingMap,
} from "../utils";
import { DibbsConceptType } from "@/app/constants";
import {
  HeadingLevel,
  Accordion as TrussAccordion,
} from "@trussworks/react-uswds";
import SelectionViewAccordionHeader from "./SelectionViewAccordionHeader";
import SelectionViewAccordionBody from "./SelectionViewAccordionBody";
import { ValueSetGrouping } from "@/app/query/components/customizeQuery/customizeQueryUtils";

type SelectionTableProps = {
  conditionId: string;
  selectedValueSets: ConditionToValueSetGroupingMap;
  activeCondition: string;
  groupedValueSetsForCondition: ValueSetsByConceptType;
  setValueSets: Dispatch<SetStateAction<ConditionToValueSetGroupingMap>>;
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
  selectedValueSets,
  activeCondition,
  setValueSets,
}) => {
  const groupedValueSetsForCondition = selectedValueSets[activeCondition];
  const [expanded, setExpandedGroup] = useState<string>("");

  const handleGroupCheckboxToggle = (
    valueSetType: DibbsConceptType,
    groupedValueSets: ValueSetGrouping[],
    isBatchUpdate: boolean,
    currentCheckboxStatus?: boolean,
  ) => {
    groupedValueSets.forEach((vs) => {
      handleSingleCheckboxToggle(
        valueSetType,
        vs,
        isBatchUpdate,
        !currentCheckboxStatus,
      );
    });
  };

  const handleSingleCheckboxToggle = (
    valueSetType: DibbsConceptType,
    groupedValueSet: ValueSetGrouping,
    isBatchUpdate: boolean = false,
    batchValue?: boolean,
  ) => {
    const key = `${groupedValueSet.valueSetName}:${groupedValueSet.author}:${groupedValueSet.system}`;
    const updatedVS = groupedValueSetsForCondition[valueSetType][key];

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

    groupedValueSetsForCondition[valueSetType] = {
      ...groupedValueSetsForCondition[valueSetType],
      [key]: groupedValueSet,
    };

    setValueSets((prevState) => {
      prevState[conditionId][valueSetType][key] = updatedVS;
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
      typesWithContent.map((valueSetType) => {
        const title = (
          <SelectionViewAccordionHeader
            valueSetType={valueSetType}
            conditionId={conditionId}
            valueSetsForType={Object.values(
              groupedValueSetsForCondition[valueSetType],
            )}
            handleCheckboxToggle={handleGroupCheckboxToggle}
            expanded={expanded?.indexOf(valueSetType) > -1 || false}
          />
        );
        const content = (
          <SelectionViewAccordionBody
            valueSetType={valueSetType}
            valueSetsForType={Object.values(
              groupedValueSetsForCondition[valueSetType],
            )}
            conditionId={conditionId}
            setValueSets={setValueSets}
          />
        );
        const level: HeadingLevel = "h4";

        const handleToggle = (e: React.MouseEvent) => {
          const element = e.currentTarget.getAttribute("data-testid");
          const startIndex = element?.indexOf(valueSetType) || 0;
          const endIndex = valueSetType.length + startIndex;

          if (expanded == valueSetType) {
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
          id: `${valueSetType}-${conditionId}`,
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
