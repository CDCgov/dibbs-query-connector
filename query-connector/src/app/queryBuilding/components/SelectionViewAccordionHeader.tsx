import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import classNames from "classnames";
import { Checkbox, Icon } from "@trussworks/react-uswds";
import { DibbsConceptType } from "@/app/constants";
import { VsGrouping } from "@/app/utils/valueSetTranslation";
import { tallyConceptsForValueSetGroupArray } from "../utils";
import { ChangeEvent } from "react";

type SelectionViewAccordionBodyProps = {
  activeValueSetType: DibbsConceptType;
  activeVsGroupings: { [vsNameAuthorSystem: string]: VsGrouping };
  expanded: boolean;
  handleVsNameLevelUpdate: (vsName: string) => (val: VsGrouping) => void;
};

/**
 * Fragment component to style out some of the accordion bodies
 * @param param0 - params
 * @param param0.activeValueSetType - DibbsactiveValueSetType (labs, conditions, medications)
 * @param param0.activeVsGroupings - ValueSets for a given activeValueSetType
 * @param param0.expanded - Boolean for managing icon orientation
 * @returns An accordion body component
 */
const SelectionViewAccordionHeader: React.FC<
  SelectionViewAccordionBodyProps
> = ({
  activeValueSetType,
  activeVsGroupings,
  expanded,
  handleVsNameLevelUpdate,
}) => {
  const selectedCount = tallyConceptsForValueSetGroupArray(
    Object.values(activeVsGroupings),
    true,
  );
  const totalCount = tallyConceptsForValueSetGroupArray(
    Object.values(activeVsGroupings),
    false,
  );

  function handleBulkToggle(e: ChangeEvent<HTMLInputElement>) {
    Object.entries(activeVsGroupings).forEach(([vsName, curGrouping]) => {
      const handleVsGroupingLevelUpdate = handleVsNameLevelUpdate(vsName);
      const updatedGrouping = structuredClone(curGrouping);
      updatedGrouping.items.map((i) => {
        return i.concepts.map((c) => (c.include = e.target.checked));
      });
      handleVsGroupingLevelUpdate(updatedGrouping);
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
          />{" "}
          <Checkbox
            name={`checkbox-${activeValueSetType}`}
            className={classNames(
              styles.valueSetTemplate__checkbox,
              isMinusState ? styles.valueSetTemplate__checkbox__partial : "",
            )}
            label={activeValueSetType}
            onChange={(e) => {
              e.stopPropagation();
              handleBulkToggle(e);
            }}
            id={`${activeValueSetType}`}
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
