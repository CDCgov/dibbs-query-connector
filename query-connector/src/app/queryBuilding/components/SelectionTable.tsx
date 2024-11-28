"use client";

import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { ValueSetsByGroup, ConditionToValueSetMap } from "../utils";
import { DibbsValueSetType } from "@/app/constants";
import Accordion from "../../query/designSystem/Accordion";
import SelectionViewAccordionHeader from "./SelectionViewAccordionHeader";
import SelectionViewAccordionBody from "./SelectionViewAccordionBody";

type SelectionTableProps = {
  conditionId: string;
  valueSets: ConditionToValueSetMap;
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
  return (
    <div data-testid="accordion" className={""}>
      {renderValueSetAccordions(conditionId, valueSets[conditionId])}
    </div>
  );
};

function renderValueSetAccordions(
  conditionId: string,
  valueSets: ValueSetsByGroup
) {
  const handleCheckboxToggle = (valueSetType: string, conditionId: string) => {
    console.log(
      `placeholder: deselect all child values (${valueSetType}) for condition ID: ${conditionId}`
    );
  };

  const types = Object.keys(valueSets) as Array<DibbsValueSetType>;

  const ValueSetAccordionItem = Object.values(types).map(
    function (valueSetType) {
      const valueSetsForType = Object.values(valueSets[valueSetType]);
      console.log(valueSetsForType);
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
    }
  );
  return <div>{ValueSetAccordionItem}</div>;
}
