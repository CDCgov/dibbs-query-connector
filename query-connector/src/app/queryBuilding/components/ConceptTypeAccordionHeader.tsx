import styles from "../conditionTemplateSelection/conditionTemplateSelection.module.scss";
import { Icon } from "@trussworks/react-uswds";
import { DibbsConceptType, DibbsValueSet } from "@/app/constants";
import { ChangeEvent } from "react";
import Checkbox from "@/app/query/designSystem/checkbox/Checkbox";

type ConceptTypeAccordionBodyProps = {
  activeValueSetType: DibbsConceptType;
  activeValueSets: { [vsId: string]: DibbsValueSet };
  expanded: boolean;
  handleVsNameLevelUpdate: (
    vsId: string,
  ) => (dibbsValueSets: DibbsValueSet) => void;
};

/**
 * Fragment component to style out some of the accordion bodies
 * @param param0 - params
 * @param param0.activeValueSetType - DibbsactiveValueSetType (labs, conditions, medications)
 * @param param0.activeValueSets - ValueSets for a given activeValueSetType
 * @param param0.expanded - Boolean for managing icon orientation
 * @param param0.handleVsNameLevelUpdate - curried state update function that
 * takes a VsName and generatesa ValueSet level update
 * @returns An accordion body component
 */
const ConceptTypeAccordionHeader: React.FC<ConceptTypeAccordionBodyProps> = ({
  activeValueSetType,
  activeValueSets,
  expanded,
  handleVsNameLevelUpdate,
}) => {
  const selectedCount = Object.values(activeValueSets).reduce(
    (acc, curValueSet) => {
      const curConceptsIncludedCount = curValueSet.concepts.filter(
        (c) => c.include,
      ).length;
      return acc + curConceptsIncludedCount;
    },
    0,
  );
  const totalCount = Object.values(activeValueSets).reduce(
    (acc, curValueSet) => {
      const curConceptsIncludedCount = curValueSet.concepts.length;
      return acc + curConceptsIncludedCount;
    },
    0,
  );

  function handleBulkToggle(
    e: ChangeEvent<HTMLInputElement>,
    isMinusState: boolean,
  ) {
    Object.entries(activeValueSets).forEach(([vsId, activeValueSets]) => {
      const handleVsGroupingLevelUpdate = handleVsNameLevelUpdate(vsId);
      const bulkIncludeValue = isMinusState ? false : e.target.checked;
      activeValueSets.includeValueSet = bulkIncludeValue;
      activeValueSets.concepts.map((c) => {
        return (c.include = bulkIncludeValue);
      });
      handleVsGroupingLevelUpdate(activeValueSets);
    });
  }

  const isMinusState = selectedCount !== totalCount && selectedCount !== 0;
  const checked =
    !!selectedCount && selectedCount == totalCount && selectedCount > 0;

  return (
    <>
      <div className={styles.accordionHeaderWrapper} key={activeValueSetType}>
        <div className={styles.valueSetTemplate__toggleRowHeader}>
          <Icon.ArrowDropUp
            aria-label="Arrow indicating collapsed or expanded toggle content"
            style={expanded ? { rotate: "180deg" } : { rotate: "90deg" }}
            size={3}
          />
          <Checkbox
            className={styles.valueSetTemplate__titleCheckbox}
            label={activeValueSetType}
            onChange={(e) => {
              e.stopPropagation();
              handleBulkToggle(e, isMinusState);
            }}
            id={`${activeValueSetType}`}
            checked={checked}
            isMinusState={isMinusState}
          />
        </div>
        <div
          className={styles.accordionHeaderCount}
        >{`${selectedCount} / ${totalCount}`}</div>
      </div>
    </>
  );
};

export default ConceptTypeAccordionHeader;
