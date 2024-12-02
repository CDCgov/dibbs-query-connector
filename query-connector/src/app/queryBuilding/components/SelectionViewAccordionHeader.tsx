import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { Checkbox, Icon } from "@trussworks/react-uswds";
import { GroupedValueSet } from "@/app/query/components/customizeQuery/customizeQueryUtils";
import { tallyConcpetsForValueSetGroup } from "../utils";
import { DibbsValueSetType } from "@/app/constants";

type SelectionViewAccordionBodyProps = {
  valueSetType: DibbsValueSetType;
  conditionId: string;
  valueSets: GroupedValueSet[] | null;
  handleCheckboxToggle: (
    valueSetType: DibbsValueSetType,
    conditionId: string,
  ) => void;
};

/**
 * Fragment component to style out some of the accordion bodies
 * @param param0 - params
 * @param param0.handleCheckboxToggle - Table / content to display once the accordion
 * @param param0.valueSetType - Title to display once the accordion is expanded
 * @param param0.conditionId - Markup id for the accordion
 * @param param0.valueSets - Markup id for the accordion
 * is expanded
 * @returns An accordion body component
 */
const SelectionViewAccordionHeader: React.FC<
  SelectionViewAccordionBodyProps
> = ({ valueSetType, conditionId, valueSets, handleCheckboxToggle }) => {
  const selectedCount =
    valueSets && tallyConcpetsForValueSetGroup(valueSets, true);
  const totalCount =
    valueSets && tallyConcpetsForValueSetGroup(valueSets, false);

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
            className={styles.valueSetTemplate__checkbox}
            label={valueSetType}
            onChange={(e) => {
              e.stopPropagation();
              handleCheckboxToggle(valueSetType, conditionId);
            }}
            id={`${conditionId}-${valueSetType}`}
            checked={
              !!selectedCount &&
              selectedCount == totalCount &&
              selectedCount > 0
            }
            disabled={selectedCount == 0}
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
