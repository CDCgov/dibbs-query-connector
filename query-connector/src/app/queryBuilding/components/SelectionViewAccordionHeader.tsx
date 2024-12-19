import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import classNames from "classnames";
import { Checkbox, Icon } from "@trussworks/react-uswds";
import { DibbsValueSetType } from "@/app/constants";
import { GroupedValueSet } from "@/app/query/components/customizeQuery/customizeQueryUtils";
import { tallyConceptsForValueSetGroup } from "../utils";

type SelectionViewAccordionBodyProps = {
  valueSetType: DibbsValueSetType;
  conditionId: string;
  valueSetsForType: GroupedValueSet[];
  handleCheckboxToggle: (
    valueSetType: DibbsValueSetType,
    groupedValueSets: GroupedValueSet[],
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
 * @param param0.valueSetType - DibbsValueSetType (labs, conditions, medications)
 * @param param0.conditionId - The ID of the active condition, whose associated value sets
 * and concepts are shown in the table
 * @param param0.valueSetsForType - ValueSets for a given ValueSetType
 * is expanded
 * @param param0.expanded - Boolean for managing icon orientation
 * @returns An accordion body component
 */
const SelectionViewAccordionHeader: React.FC<
  SelectionViewAccordionBodyProps
> = ({
  valueSetType,
  conditionId,
  valueSetsForType,
  handleCheckboxToggle,
  expanded,
}) => {
  console.log("header type: ", valueSetsForType);
  const selectedCount = tallyConceptsForValueSetGroup(valueSetsForType, true);
  const totalCount = tallyConceptsForValueSetGroup(valueSetsForType, false);

  const isMinusState = selectedCount !== totalCount && selectedCount !== 0;
  const checked =
    !!selectedCount && selectedCount == totalCount && selectedCount > 0;

  return (
    <>
      <div className={styles.accordionHeaderWrapper} key={valueSetType}>
        <div className={styles.valueSetTemplate__toggleRowHeader}>
          <Icon.ArrowDropUp
            aria-label="Arrow indicating collapsed or expanded toggle content"
            style={expanded ? { rotate: "180deg" } : { rotate: "90deg" }}
            size={3}
          />{" "}
          <Checkbox
            name={`checkbox-${valueSetType}`}
            className={classNames(
              styles.valueSetTemplate__checkbox,
              isMinusState ? styles.valueSetTemplate__checkbox__partial : "",
            )}
            label={valueSetType}
            onChange={(e) => {
              e.stopPropagation();
              handleCheckboxToggle(
                valueSetType,
                valueSetsForType,
                true,
                checked,
              );
            }}
            id={`${conditionId}-${valueSetType}`}
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
