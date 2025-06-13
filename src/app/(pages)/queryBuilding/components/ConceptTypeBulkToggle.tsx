import { ChangeEvent, useRef } from "react";
import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import Checkbox from "@/app/ui/designSystem/checkbox/Checkbox";
import { Icon } from "@trussworks/react-uswds";
import { DibbsConceptType } from "@/app/models/entities/valuesets";

interface ConceptTypeBulkToggleProps {
  activeType: DibbsConceptType;
  expanded: boolean;
  selectedCount: number;
  totalCount: number;
  handleBulkToggle: (
    e: ChangeEvent<HTMLInputElement>,
    isMinusState: boolean,
  ) => void;
}

/**
 * Concept type information to render, with checkbox / label that changes focus on
 * hover
 * @param param0 - params
 * @param param0.activeType - the type to display
 * @param param0.selectedCount - the number of selected concepts
 * @param param0.totalCount - the total number of concepts
 * @param param0.expanded - whether the accordion should be expanded
 * @param param0.handleBulkToggle - toggle event to trigger when the label is clicked
 * @returns The label + checkbox for the accordion
 */
const ConceptTypeBulkToggle: React.FC<ConceptTypeBulkToggleProps> = ({
  activeType,
  selectedCount,
  totalCount,
  expanded,
  handleBulkToggle,
}) => {
  const isMinusState = selectedCount !== totalCount && selectedCount !== 0;
  const checked = selectedCount == totalCount && selectedCount > 0;
  const focusElementRef = useRef<HTMLDivElement>(null);

  const setFocusOnCheckbox = () => {
    if (focusElementRef.current) {
      focusElementRef.current.focus();
    }
  };
  const removeFocusFromCheckbox = () => {
    if (focusElementRef.current) {
      focusElementRef.current.blur();
    }
  };

  const checkboxLabel = (
    <div
      onMouseEnter={setFocusOnCheckbox}
      onMouseLeave={removeFocusFromCheckbox}
      onClick={(e) => e.stopPropagation()}
    >
      {activeType}
    </div>
  );

  const checkboxToRender = (
    <div
      className={styles.checkboxInfoContainer}
      ref={focusElementRef}
      tabIndex={0}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.valueSetTemplate__toggleRowHeader}>
        <Icon.ArrowDropUp
          aria-label="Arrow indicating collapsed or expanded toggle content"
          style={expanded ? { rotate: "180deg" } : { rotate: "90deg" }}
          size={3}
        />
        <Checkbox
          className={styles.valueSetTemplate__titleCheckbox}
          label={checkboxLabel}
          onChange={(e) => {
            e.stopPropagation();
            handleBulkToggle(e, isMinusState);
          }}
          id={`checkbox-${activeType}`}
          checked={checked}
          isMinusState={isMinusState}
        />
      </div>
    </div>
  );

  return checkboxToRender;
};

export default ConceptTypeBulkToggle;
