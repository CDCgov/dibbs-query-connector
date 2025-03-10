import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import { Icon } from "@trussworks/react-uswds";
import { ChangeEvent } from "react";
import Checkbox from "@/app/ui/designSystem/checkbox/Checkbox";
import { FilterableValueSet } from "./utils";
import { DibbsConceptType } from "@/app/models/entities/valuesets";

type ConceptTypeAccordionBodyProps = {
  activeType: DibbsConceptType;
  activeTypeValueSets: { [vsId: string]: FilterableValueSet };
  expanded: boolean;
  handleVsNameLevelUpdate: (
    vsId: string,
  ) => (dibbsValueSets: FilterableValueSet) => void;
  areItemsFiltered?: boolean;
};

/**
 * Fragment component to style out some of the accordion bodies
 * @param param0 - params
 * @param param0.activeType - DibbsactiveValueSetType (labs, conditions, medications)
 * @param param0.activeTypeValueSets - ValueSets for a given activeValueSetType
 * @param param0.expanded - Boolean for managing icon orientation
 * @param param0.handleVsNameLevelUpdate - curried state update function that
 * takes a VsName and generatesa ValueSet level update
 * @param param0.areItemsFiltered - whether the activeValueSets are filtered to
 * assist with some additional rendering logic
 * @returns An accordion body component
 */
const ConceptTypeAccordionHeader: React.FC<ConceptTypeAccordionBodyProps> = ({
  activeType,
  activeTypeValueSets,
  expanded,
  handleVsNameLevelUpdate,
  areItemsFiltered = false,
}) => {
  const selectedCount = Object.values(activeTypeValueSets).reduce(
    (acc, curValueSet) => {
      const curConceptsIncludedCount = curValueSet.concepts.filter(
        (c) => c.include && c.render,
      ).length;
      return acc + curConceptsIncludedCount;
    },
    0,
  );
  const totalCount = Object.values(activeTypeValueSets).reduce(
    (acc, curValueSet) => {
      const curConceptsIncludedCount = curValueSet.concepts.filter(
        (c) => c.render,
      ).length;
      return acc + curConceptsIncludedCount;
    },
    0,
  );

  function handleBulkToggle(
    e: ChangeEvent<HTMLInputElement>,
    isMinusState: boolean,
  ) {
    Object.entries(activeTypeValueSets).forEach(([vsId, activeValueSets]) => {
      const handleValueSetUpdate = handleVsNameLevelUpdate(vsId);
      const bulkIncludeValue = isMinusState ? false : e.target.checked;
      activeValueSets.includeValueSet = bulkIncludeValue;
      activeValueSets.concepts.map((c) => {
        if (c.render) {
          c.include = bulkIncludeValue;
        }
        return c;
      });
      handleValueSetUpdate(activeValueSets);
    });
  }

  const isMinusState = selectedCount !== totalCount && selectedCount !== 0;
  const checked =
    !!selectedCount && selectedCount == totalCount && selectedCount > 0;

  return (
    <>
      <div className={styles.accordionHeaderWrapper} key={activeType}>
        <div className={styles.valueSetTemplate__toggleRowHeader}>
          <Icon.ArrowDropUp
            aria-label="Arrow indicating collapsed or expanded toggle content"
            style={expanded ? { rotate: "180deg" } : { rotate: "90deg" }}
            size={3}
          />
          <Checkbox
            className={styles.valueSetTemplate__titleCheckbox}
            label={activeType}
            onChange={(e) => {
              e.stopPropagation();
              handleBulkToggle(e, isMinusState);
            }}
            id={`${activeType}`}
            checked={checked}
            isMinusState={isMinusState}
          />
        </div>
        <div className={styles.accordionHeaderCount}>
          {areItemsFiltered
            ? `${
                Object.values(activeTypeValueSets).filter((v) => v.render)
                  .length
              } valueset(s) found`
            : `${selectedCount} / ${totalCount}`}
        </div>
      </div>
    </>
  );
};

export default ConceptTypeAccordionHeader;
