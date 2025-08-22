import { Icon } from "@trussworks/react-uswds";
import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";

import { FilterableValueSet } from "./utils";
import { DibbsConceptType } from "@/app/models/entities/valuesets";
import {
  DateRangeInfo,
  formatDateRangeToMMDDYY,
  matchTimeRangeToOptionValue,
} from "@/app/ui/designSystem/timeboxing/DateRangePicker";
// import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";

type ConceptTypeAccordionBodyProps = {
  activeType: DibbsConceptType;
  activeTypeValueSets: { [vsId: string]: FilterableValueSet };
  expanded: boolean;
  initialTimeboxRange?: DateRangeInfo;
  areItemsFiltered?: boolean;
};

/**
 * Fragment component to style out some of the accordion bodies
 * @param param0 - params
 * @param param0.activeType - DibbsactiveValueSetType (labs, conditions, medications)
 * @param param0.activeTypeValueSets - ValueSets for a given activeValueSetType
 * @param param0.initialTimeboxRange - Timebox ranges
 * @param param0.expanded - Boolean for managing icon orientation
 * takes a VsName and generatesa ValueSet level update
 * @param param0.areItemsFiltered - whether the activeValueSets are filtered to
 * assist with some additional rendering logic
 * @returns An accordion body component
 */
const ConceptTypeAccordionHeader: React.FC<ConceptTypeAccordionBodyProps> = ({
  activeType,
  activeTypeValueSets,
  expanded,
  initialTimeboxRange,
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

  let dateRangeLabel;
  if (initialTimeboxRange?.endDate && initialTimeboxRange.startDate) {
    const displayValues = matchTimeRangeToOptionValue(
      initialTimeboxRange?.startDate,
      initialTimeboxRange?.endDate,
      initialTimeboxRange.isRelativeRange,
    );

    displayValues.isPreset
      ? (dateRangeLabel = displayValues.label)
      : (dateRangeLabel = formatDateRangeToMMDDYY(
          initialTimeboxRange.startDate,
          initialTimeboxRange.endDate,
        )); // is an absolute / custom range, so display the dates
  }

  return (
    <>
      <div className={styles.accordionHeaderContent} key={activeType}>
        <div className={styles.accordionLabel}>
          <Icon.ArrowDropUp
            aria-label="Arrow indicating collapsed or expanded toggle content"
            style={expanded ? { rotate: "180deg" } : { rotate: "90deg" }}
            size={3}
          />
          <div
            data-testid={`accordionHeader_${activeType}`}
            className={styles.accordionLabel}
          >
            {dateRangeLabel ? `${activeType}:` : activeType}
            <span className="text-normal padding-left-05">
              {dateRangeLabel ? `${dateRangeLabel}` : " "}
            </span>
          </div>
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
