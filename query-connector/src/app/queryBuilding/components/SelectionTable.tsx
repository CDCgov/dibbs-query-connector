"use client";

import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import {
  // Accordion,
  Checkbox,
  Icon,
} from "@trussworks/react-uswds";
import { ValueSetsByGroup } from "../utils";
// import formatIdForAnchorTag from "../../query/components/resultsView/ResultsViewTable";
// import SelectionViewAccordionBody from "./SelectionViewAccordionBody";
import { DibbsValueSetType } from "@/app/constants";

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
  // const accordionItems = renderValueSetAccordions(conditionId, valueSets);
  return (
    <div data-testid="accordion" className={""}>
      {/* {accordionItems.map((item) => {
        const titleId = formatIdForAnchorTag(item.title);

        return (
          item.content && (
            <div className="styles.accordionInstance" key={item.title}>
              <Accordion
                title=""
                content={
                  <SelectionViewAccordionBody
                    title={item.subtitle ?? ""}
                    content={item.content}
                    id={formatIdForAnchorTag(item.subtitle ?? "")}
                  />
                }
                expanded={true}
                id={titleId}
                key={titleId}
                headingLevel={"h3"}
                accordionClassName={styles.accordionWrapper}
                containerClassName={styles.accordionContainer}
              />
            </div>
          )
        );
      })} */}
      {renderValueSetAccordions(conditionId, valueSets)}
    </div>
  );
};

const calculateTotals = (valueSets: ValueSetsByGroup, valueSetType: string) => {
  const valueSetsByGroup =
    valueSets[valueSetType.toLocaleLowerCase() as keyof ValueSetsByGroup];
  console.log(valueSets, valueSetType);
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
      console.log(types, valueSetType);
      const total = calculateTotals(valueSets, valueSetType).total;
      const selected = calculateTotals(valueSets, valueSetType).selected;

      return (
        <div className={styles.valueSetTemplate__accordion} key={valueSetType}>
          <div className={styles.valueSetTemplate__toggleRowHeader}>
            <Icon.ArrowDropUp
              aria-label="Arrow pointing right indicating collapsed toggle content"
              style={{ rotate: "90deg" }}
              size={3}
              tabIndex={0}
            />{" "}
            <Checkbox
              name={`checkbox-${valueSetType}`}
              className={styles.valueSetTemplate__checkbox}
              label={valueSetType}
              onChange={(e) => {
                e.stopPropagation();
                handleCheckboxToggle(valueSetType, conditionId);
              }}
              id={`${conditionId}-${valueSetType}`}
              checked={selected == total && selected > 0}
              disabled={selected == 0}
            />
          </div>
          <div>{`${selected} / ${total}`}</div>
        </div>
      );
    }
  );
  return <div>{ValueSetAccordionItem}</div>;
}
