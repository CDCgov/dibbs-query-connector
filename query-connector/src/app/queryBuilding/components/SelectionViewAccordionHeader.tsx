import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import classNames from "classnames";
import { Icon } from "@trussworks/react-uswds";
import { DibbsConceptType } from "@/app/constants";
import { VsGrouping } from "@/app/utils/valueSetTranslation";
import Checkbox from "@/app/query/designSystem/checkbox/Checkbox";

type SelectionViewAccordionBodyProps = {
  activeValueSetType: DibbsConceptType;
  conditionId: string;
  selectedCount: number;
  totalCount: number;
  activeVsGroupings: VsGrouping[];
  handleCheckboxToggle: (
    activeValueSetType: DibbsConceptType,
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
 * @param param0.activeValueSetType - DibbsactiveValueSetType (labs, conditions, medications)
 * @param param0.conditionId - The ID of the active condition, whose associated value sets
 * and concepts are shown in the table
 * @param param0.activeVsGroupings - ValueSets for a given activeValueSetType
 * @param param0.totalCount - Number of Concepts associated with all the Value Sets for the DibbsactiveValueSetType
 * @param param0.selectedCount - Number of Concepts that are marked as selected
 * is expanded
 * @param param0.expanded - Boolean for managing icon orientation
 * @returns An accordion body component
 */
const SelectionViewAccordionHeader: React.FC<
  SelectionViewAccordionBodyProps
> = ({
  activeValueSetType,
  conditionId,
  selectedCount,
  totalCount,
  activeVsGroupings,
  handleCheckboxToggle,
  expanded,
}) => {
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
          />{" "}
          <Checkbox
            className={classNames(
              styles.valueSetTemplate__checkbox,
              isMinusState ? styles.valueSetTemplate__checkbox__partial : "",
            )}
            label={activeValueSetType}
            onChange={() => {
              handleCheckboxToggle(
                activeValueSetType,
                activeVsGroupings,
                true,
                checked,
              );
            }}
            id={`${conditionId}-${activeValueSetType}`}
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
