import { Checkbox } from "@trussworks/react-uswds";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { GroupedValueSet } from "@/app/query/components/customizeQuery/customizeQueryUtils";
import { formatDiseaseDisplay } from "../utils";

type SelectionViewAccordionBodyProps = {
  id?: string;
  valueSetType: string;
  valueSets: GroupedValueSet[];
  handleCheckboxToggle: (valueSetType: string, conditionId: string) => void;
};

/**
 * Fragment component to style out some of the accordion bodies
 * @param param0 - params
 * @param param0.valueSetType - Title to display once the accordion is expanded
 * @param param0.valueSets - tk
 * is expanded
 * @returns An accordion body component
 */
const SelectionViewAccordionBody: React.FC<SelectionViewAccordionBodyProps> = ({
  valueSetType,
  valueSets,
}) => {
  return (
    <div>
      {valueSets.map((vs) => {
        return (
          <>
            <div className={styles.accordionBodyExpanded} key={valueSetType}>
              <div className={styles.accordionExpandedInner}>
                <Checkbox
                  name={`checkbox-${vs.valueSetName}`}
                  className={styles.valueSetTemplate__checkbox}
                  label={checkboxLabel(vs.valueSetName, vs.author, vs.system)}
                  onChange={(e) => {
                    e.stopPropagation();
                    // handleCheckboxToggle(valueSetType, conditionId);
                  }}
                  id={`${vs.valueSetName}-${valueSetType}`}
                  checked={true}
                  // disabled={selectedCount == 0}
                />{" "}
              </div>
              <div>1/1</div>
            </div>
          </>
        );
      })}
    </div>
  );
};

const checkboxLabel = (name: string, author: string, system: string) => {
  return (
    <div className={styles.expandedContent}>
      <div className={styles.vsName}> {formatDiseaseDisplay(name)}</div>
      <div className={styles.vsDetails}>
        <div style={{ paddingRight: "1rem" }}>{`Author: ${author}`}</div>
        <div>{`System: ${system.toLocaleLowerCase()}`}</div>
      </div>
    </div>
  );
};

export default SelectionViewAccordionBody;
