import Checkbox from "../../../ui/designSystem/checkbox/Checkbox";
import { formatDiseaseDisplay } from "../utils";
import styles from "./conditionTemplateSelection.module.scss";

type ConditionOptionProps = {
  conditionId: string;
  conditionName: string;
  handleConditionSelection: (conditionId: string, checked: boolean) => void;
  checked: boolean;
};

/**
 * Display component for a condition on the query building page
 * @param root0 - params
 * @param root0.conditionId - ID of the condition to reference
 * @param root0.conditionName - name of condition to display
 * @param root0.handleConditionSelection - listener function for checkbox
 * selection
 * @param root0.checked - current checkbox selection status
 * @returns A component for display to redner on the query building page
 */
const ConditionOption: React.FC<ConditionOptionProps> = ({
  conditionId,
  conditionName,
  handleConditionSelection,
  checked,
}) => {
  return (
    <div className={styles.categoryOption}>
      <Checkbox
        onChange={() => {
          handleConditionSelection(conditionId, checked);
        }}
        id={conditionId}
        label={formatDiseaseDisplay(conditionName)}
        checked={checked}
      />
    </div>
  );
};

export default ConditionOption;
