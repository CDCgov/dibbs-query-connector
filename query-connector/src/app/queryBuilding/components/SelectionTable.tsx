"use client";
import { Dispatch, SetStateAction } from "react";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import {
  ValueSetsByGroup,
  batchToggleConcepts,
  tallyConcpetsForValueSetGroup,
  ConditionToValueSetMap,
} from "../utils";
import { DibbsValueSetType } from "@/app/constants";
import Accordion from "../../query/designSystem/Accordion";
import SelectionViewAccordionHeader from "./SelectionViewAccordionHeader";
import SelectionViewAccordionBody from "./SelectionViewAccordionBody";
import { GroupedValueSet } from "@/app/query/components/customizeQuery/customizeQueryUtils";

type SelectionTableProps = {
  conditionId: string;
  groupedValueSetsForCondition: ValueSetsByGroup;
  setValueSets: Dispatch<SetStateAction<ConditionToValueSetMap>>;
};

// * @param root0.conditionId - ID of the active/selected condition
// * @param root0.valueSets - Value Sets associated with the active condition

/**
 * Detail display component for a condition on the query building page
 * @param root0 - params
 * @param root0.conditionId - The ID of the active condition, whose associated value sets
 * and concepts are shown in the table
 * @param root0.groupedValueSetsForCondition - Value Sets for the active condition, organized by
 * type (conditions, labs, medications)
 * @param root0.setValueSets - State function that updates the include/exclude status of
 * a Value Set and its associated Concepts
 * @returns A component for display to render on the query building page
 */
export const SelectionTable: React.FC<SelectionTableProps> = ({
  conditionId,
  groupedValueSetsForCondition,
  setValueSets,
}) => {
  return (
    <div data-testid="accordion" className={""}>
      {renderValueSetAccordions(
        conditionId,
        groupedValueSetsForCondition,
        setValueSets
      )}
    </div>
  );
};

function renderValueSetAccordions(
  conditionId: string,
  valueSets: ValueSetsByGroup,
  setValueSets: React.Dispatch<React.SetStateAction<ConditionToValueSetMap>>
) {
  const handleGroupCheckboxToggle = (
    valueSetType: DibbsValueSetType,
    groupedValueSets: GroupedValueSet[]
  ) => {
    groupedValueSets.forEach((vs) => {
      handleSingleCheckboxToggle(valueSetType, vs);
    });
  };

  const handleSingleCheckboxToggle = (
    valueSetType: DibbsValueSetType,
    groupedValueSet: GroupedValueSet
  ) => {
    const key = `${groupedValueSet.valueSetName}:${groupedValueSet.author}:${groupedValueSet.system}`;
    const updatedVS = valueSets[valueSetType][key];

    groupedValueSet.items = Object.values(updatedVS.items).map((vs) => {
      batchToggleConcepts(vs);
      vs.includeValueSet = !vs.includeValueSet;
      return vs;
    });

    valueSets[valueSetType] = {
      ...valueSets[valueSetType],
      [key]: groupedValueSet,
    };

    setValueSets((prevState) => {
      return {
        ...prevState,
        [conditionId]: {
          ...prevState?.[conditionId],
          [valueSetType]: {
            ...prevState?.[conditionId]?.[valueSetType],
            [key]: updatedVS,
          },
        },
      };
    });
  };

  const types =
    valueSets && (Object.keys(valueSets) as Array<DibbsValueSetType>);

  const ValueSetAccordionItem =
    types &&
    Object.values(types).map(function (valueSetType) {
      const valueSetsForType: GroupedValueSet[] = Object.values(
        valueSets[valueSetType]
      );
      const totalCount = tallyConcpetsForValueSetGroup(valueSetsForType, false);
      const selectedCount = tallyConcpetsForValueSetGroup(
        valueSetsForType,
        true
      );

      return (
        <div
          className={styles.valueSetTemplate__accordionContainer}
          key={`${valueSetType}-${conditionId}`}
        >
          <Accordion
            title={
              <SelectionViewAccordionHeader
                valueSetType={valueSetType}
                conditionId={conditionId}
                totalCount={totalCount}
                selectedCount={selectedCount}
                valueSetsForType={valueSetsForType}
                handleCheckboxToggle={handleGroupCheckboxToggle}
              />
            }
            content={
              <SelectionViewAccordionBody
                valueSetType={valueSetType}
                handleCheckboxToggle={handleSingleCheckboxToggle}
                valueSetsForType={valueSetsForType}
              />
            }
            expanded={false}
            id={`${valueSetType}-${conditionId}`}
            key={`${valueSetType}-${conditionId}`}
            accordionClassName={styles.accordionInnerWrapper}
            containerClassName={styles.accordionContainer}
          />
        </div>
      );
    });

  return <div>{ValueSetAccordionItem}</div>;
}
