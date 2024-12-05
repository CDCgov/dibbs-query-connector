import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import classNames from "classnames";
import { Checkbox, Icon } from "@trussworks/react-uswds";
import { DibbsValueSetType } from "@/app/constants";
import { GroupedValueSet } from "@/app/query/components/customizeQuery/customizeQueryUtils";

type SelectionViewAccordionBodyProps = {
  valueSetType: DibbsValueSetType;
  conditionId: string;
  selectedCount: number;
  totalCount: number;
  valueSetsForType: GroupedValueSet[];
  handleCheckboxToggle: (
    valueSetType: DibbsValueSetType,
    groupedValueSets: GroupedValueSet[]
  ) => void;
};

/**
 * Fragment component to style out some of the accordion bodies
 * @param param0 - params
 * @param param0.handleCheckboxToggle - Listener event to handle a ValueSet inclusion/
 * exclusion check
 * @param param0.valueSetType - DibbsValueSetType (labs, conditions, medications)
 * @param param0.conditionId - The ID of the active condition, whose associated value sets
 * and concepts are shown in the table
 * @param param0.valueSetsForType - ValueSets for a given ValueSetType
 * @param param0.totalCount - Number of Concepts associated with all the Value Sets for the DibbsValueSetType
 * @param param0.selectedCount - Number of Concepts that are marked as selected
 * is expanded
 * @returns An accordion body component
 */
const SelectionViewAccordionHeader: React.FC<
  SelectionViewAccordionBodyProps
> = ({
  valueSetType,
  conditionId,
  selectedCount,
  totalCount,
  valueSetsForType,
  handleCheckboxToggle,
}) => {
  const isMinusState = selectedCount !== totalCount && selectedCount !== 0;
  return (
    <>
      <div className={styles.accordionHeaderWrapper} key={valueSetType}>
        <div className={styles.valueSetTemplate__toggleRowHeader}>
          <Icon.ArrowDropUp
            aria-label="Arrow pointing right indicating collapsed toggle content"
            style={{ rotate: "90deg" }}
            size={3}
          />{" "}
          <Checkbox
            name={`checkbox-${valueSetType}`}
            className={classNames(
              styles.valueSetTemplate__checkbox,
              isMinusState ? styles.valueSetTemplate__checkbox__partial : ""
            )}
            label={valueSetType}
            onChange={(e) => {
              e.stopPropagation();
              handleCheckboxToggle(valueSetType, valueSetsForType);
            }}
            id={`${conditionId}-${valueSetType}`}
            checked={
              !!selectedCount &&
              selectedCount == totalCount &&
              selectedCount > 0
            }
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
