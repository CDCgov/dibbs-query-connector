"use client";

import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import SelectionViewAccordionBody from "./SelectionViewAccordionBody";

import { ValueSetsByGroup, ConditionToValueSetMap } from "../utils";
// import formatIdForAnchorTag from "../../query/components/resultsView/ResultsViewTable";
// import SelectionViewAccordionBody from "./SelectionViewAccordionBody";
import { DibbsValueSetType } from "@/app/constants";
import Accordion from "../../query/designSystem/Accordion";
import SelectionViewAccordionHeader from "./SelectionViewAccordionHeader";

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
      const total = calculateTotals(valueSets, valueSetType).total;
      const selected = calculateTotals(valueSets, valueSetType).selected;
      const valueSetsForType = Object.values(valueSets[valueSetType]);

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
                conditionId={conditionId}
                selected={selected}
                total={total}
                title=""
                content={""}
                handleCheckboxToggle={handleCheckboxToggle}
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
const calculateTotals = (valueSets: ValueSetsByGroup, valueSetType: string) => {
  const valueSetsByGroup =
    valueSets[valueSetType.toLocaleLowerCase() as keyof ValueSetsByGroup];

  const total = valueSetsByGroup && Object.keys(valueSetsByGroup).length;
  let selected =
    valueSetsByGroup &&
    Object.values(valueSetsByGroup).filter((vs) => {
      return vs.items.filter((obj) => obj.includeValueSet == true);
    }).length;

  return {
    total,
    selected,
  };
};
