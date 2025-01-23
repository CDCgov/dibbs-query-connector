import { DibbsValueSet } from "@/app/constants";
import styles from "./customizeQuery.module.scss";
import Checkbox from "../../../designSystem/checkbox/Checkbox";

type CustomizeQueryAccordionProps = {
  handleSelectAllChange: (groupIndex: string, checked: boolean) => void;
  vsIndex: string;
  valueSet: DibbsValueSet;
};

/**
 * Rendering component for customize query header
 * @param param0 - props for rendering
 * @param param0.handleSelectAllChange
 * Listner function to include all valuesets when checkbox is selected
 * @param param0.vsIndex - index corresponding to group
 * @param param0.valueSet - matched concept containing all rendered valuesets
 * @returns A component that renders the customization query body
 */
const CustomizeQueryAccordionHeader: React.FC<CustomizeQueryAccordionProps> = ({
  handleSelectAllChange,
  vsIndex,
  valueSet,
}) => {
  const selectedTotal = valueSet.concepts.length;
  const selectedCount = valueSet.concepts.filter(
    (concept) => concept.include,
  ).length;
  const isMinusState = selectedCount !== selectedTotal && selectedCount !== 0;

  return (
    <div
      className={`${styles.accordionHeader} display-flex flex-no-wrap flex-align-start customize-query-header`}
    >
      <Checkbox
        id={valueSet.valueSetName}
        checked={selectedCount === selectedTotal}
        isMinusState={isMinusState}
        onChange={() => {
          handleSelectAllChange(
            vsIndex,
            isMinusState ? false : selectedCount !== selectedTotal,
          );
        }}
        className={styles.checkboxCell}
      />
      <div className={`${styles.accordionButtonTitle}`}>
        {`${valueSet.valueSetName}`}

        <span className={`${styles.accordionSubtitle} margin-top-2`}>
          <strong>Author:</strong> {valueSet.author}{" "}
          <strong style={{ marginLeft: "20px" }}>System:</strong>{" "}
          {valueSet.system}
        </span>
      </div>
      <span className="margin-left-auto">{`${selectedCount} of ${selectedTotal} selected`}</span>
    </div>
  );
};

export default CustomizeQueryAccordionHeader;
