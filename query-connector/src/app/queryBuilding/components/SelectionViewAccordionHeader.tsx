import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import classNames from "classnames";
import { Checkbox, Icon } from "@trussworks/react-uswds";
import { DibbsConceptType } from "@/app/constants";
import { VsGrouping } from "@/app/utils/valueSetTranslation";
import { tallyConceptsForValueSetGroup } from "../utils";

type SelectionViewAccordionBodyProps = {
  activeConceptType: DibbsConceptType;
  conditionId: string;
  activeVsGroupings: VsGrouping[];
  handleCheckboxToggle: (
    activeConceptType: DibbsConceptType,
    groupedValueSets: VsGrouping[],
    batchUpdate: boolean,
    checkedState: boolean,
  ) => void;
  expanded: boolean;
};

/**
 * Fragment component to style out some of the accordion bodies
 * @param param0 - params
 * @param param0.handleCheckboxToggle - Listener event to handle a ValueSet inclusion/
 * exclusion check
 * @param param0.activeConceptType - DibbsactiveConceptType (labs, conditions, medications)
 * @param param0.conditionId - The ID of the active condition, whose associated value sets
 * and concepts are shown in the table
 * @param param0.activeVsGroupings - ValueSets for a given activeConceptType
 * @param param0.expanded - Boolean for managing icon orientation
 * @returns An accordion body component
 */
const SelectionViewAccordionHeader: React.FC<
  SelectionViewAccordionBodyProps
> = ({
  activeConceptType,
  conditionId,
  activeVsGroupings,
  handleCheckboxToggle,
  expanded,
}) => {
  const selectedCount = tallyConceptsForValueSetGroup(activeVsGroupings, true);
  const totalCount = tallyConceptsForValueSetGroup(activeVsGroupings, false);

  const isMinusState = selectedCount !== totalCount && selectedCount !== 0;
  const checked =
    !!selectedCount && selectedCount == totalCount && selectedCount > 0;

  return (
    <>
      <div className={styles.accordionHeaderWrapper} key={activeConceptType}>
        <div className={styles.valueSetTemplate__toggleRowHeader}>
          <Icon.ArrowDropUp
            aria-label="Arrow indicating collapsed or expanded toggle content"
            style={expanded ? { rotate: "180deg" } : { rotate: "90deg" }}
            size={3}
          />{" "}
          <Checkbox
            name={`checkbox-${activeConceptType}`}
            className={classNames(
              styles.valueSetTemplate__checkbox,
              isMinusState ? styles.valueSetTemplate__checkbox__partial : "",
            )}
            label={activeConceptType}
            onChange={(e) => {
              e.stopPropagation();
              handleCheckboxToggle(
                activeConceptType,
                activeVsGroupings,
                true,
                checked,
              );
            }}
            id={`${conditionId}-${activeConceptType}`}
            checked={checked}
          />
        </div>
        <div
          className={styles.accordionHeaderCount}
        >{`${selectedCount} / ${totalCount}`}</div>
      </div>
    </>
  );
};

export default SelectionViewAccordionHeader;
