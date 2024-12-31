import { VsGrouping } from "@/app/utils/valueSetTranslation";
import styles from "./customizeQuery.module.scss";
import CustomizeQueryCheckbox from "./vanityCheckbox/CustomizeQueryCheckbox";

type CustomizeQueryAccordionProps = {
  handleSelectAllChange: (groupIndex: string, checked: boolean) => void;
  groupIndex: string;
  group: VsGrouping;
};

/**
 * Rendering component for customize query header
 * @param param0 - props for rendering
 * @param param0.handleSelectAllChange
 * Listner function to include all valuesets when checkbox is selected
 * @param param0.groupIndex - index corresponding to group
 * @param param0.group - matched concept containing all rendered valuesets
 * @returns A component that renders the customization query body
 */
const CustomizeQueryAccordionHeader: React.FC<CustomizeQueryAccordionProps> = ({
  handleSelectAllChange,
  groupIndex,
  group,
}) => {
  const selectedTotal = group.items.reduce((sum, vs) => {
    sum += vs.concepts.length;
    return sum;
  }, 0);
  const selectedCount = group.items.reduce((sum, vs) => {
    const includedConcepts = vs.concepts.filter((c) => c.include);
    sum += includedConcepts.length;
    return sum;
  }, 0);
  const isMinusState = selectedCount !== selectedTotal && selectedCount !== 0;

  return (
    <div
      className={`${styles.accordionHeader} display-flex flex-no-wrap flex-align-start customize-query-header`}
    >
      <CustomizeQueryCheckbox
        id={group.valueSetName}
        checked={selectedCount === selectedTotal}
        isMinusState={isMinusState}
        isHeader
        onChange={() => {
          handleSelectAllChange(
            groupIndex,
            isMinusState ? false : selectedCount !== selectedTotal,
          );
        }}
      />
      <div className={`${styles.accordionButtonTitle}`}>
        {`${group.valueSetName}`}

        <span className={`${styles.accordionSubtitle} margin-top-2`}>
          <strong>Author:</strong> {group.author}{" "}
          <strong style={{ marginLeft: "20px" }}>System:</strong> {group.system}
        </span>
      </div>
      <span className="margin-left-auto">{`${selectedCount} of ${selectedTotal} selected`}</span>
    </div>
  );
};

export default CustomizeQueryAccordionHeader;
