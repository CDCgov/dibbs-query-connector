import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import { ChangeEvent } from "react";
import { FilterableValueSet } from "./utils";
import { DibbsConceptType } from "@/app/models/entities/valuesets";
import ConceptTypeBulkToggle from "./ConceptTypeBulkToggle";

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

  return (
    <>
      <div className={styles.accordionHeaderWrapper} key={activeType}>
        <ConceptTypeBulkToggle
          activeType={activeType}
          expanded={expanded}
          selectedCount={selectedCount}
          totalCount={totalCount}
          handleBulkToggle={handleBulkToggle}
        ></ConceptTypeBulkToggle>
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
