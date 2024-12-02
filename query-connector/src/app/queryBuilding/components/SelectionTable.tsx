"use client";
import { useEffect } from "react";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { ValueSetsByGroup, batchSelectConcepts } from "../utils";
import { DibbsValueSetType } from "@/app/constants";
import Accordion from "../../query/designSystem/Accordion";
import SelectionViewAccordionHeader from "./SelectionViewAccordionHeader";
import SelectionViewAccordionBody from "./SelectionViewAccordionBody";
import { ValueSet } from "@/app/constants";
import { GroupedValueSet } from "@/app/query/components/customizeQuery/customizeQueryUtils";

type SelectionTableProps = {
  conditionId: string;
  valueSets: ValueSetsByGroup;
};

// * @param root0.conditionId - ID of the active/selected condition
// * @param root0.valueSets - Value Sets associated with the active condition

/**
 * Detail display component for a condition on the query building page
 * @param root0 - params
 * @param root0.conditionId - an array of items to render as an accordion
 * @param root0.valueSets - an array of items to render as an accordion
 * @returns A component for display to render on the query building page
 */
export const SelectionTable: React.FC<SelectionTableProps> = ({
  conditionId,
  valueSets,
}) => {
  useEffect(() => {});

  return (
    <div data-testid="accordion" className={""}>
      {renderValueSetAccordions(conditionId, valueSets)}
    </div>
  );
};

function toggleVSConceptCheckboxes(items: ValueSet[], setTo: boolean) {
  items.forEach((item) => {
    batchSelectConcepts(item, setTo);
  });
  return items;
}

function renderValueSetAccordions(
  conditionId: string,
  valueSets: ValueSetsByGroup,
) {
  const handleCheckboxToggle = (
    valueSetType: DibbsValueSetType,
    conditionId: string,
  ) => {
    console.log(
      valueSets[valueSetType],
      `placeholder: deselect all child values (${valueSetType}) for condition ID: ${conditionId}`,
    );
  };

  const types = Object.keys(valueSets) as Array<DibbsValueSetType>;

  const ValueSetAccordionItem = Object.values(types).map(
    function (valueSetType) {
      const valueSetsForType: GroupedValueSet[] = Object.values(
        valueSets[valueSetType],
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
                valueSets={valueSetsForType}
                handleCheckboxToggle={handleCheckboxToggle}
              />
            }
            content={
              <SelectionViewAccordionBody
                valueSetType={valueSetType}
                handleCheckboxToggle={handleCheckboxToggle}
                valueSets={valueSetsForType}
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
    },
  );

  return <div>{ValueSetAccordionItem}</div>;
}
