import Checkbox from "../../query/designSystem/checkbox/Checkbox";
import { ConditionDetails, formatDiseaseDisplay } from "../utils";

type ConditionOptionProps = {
  conditionId: string;
  conditionNameAndInclude: ConditionDetails;
  handleConditionSelection: (conditionId: string) => void;
};

/**
 * Display component for a condition on the query building page
 * @param root0 - params
 * @param root0.conditionIdToTemplateMap - the ID: Condition name map that needs to
 * be displayed
 * @param root0.conditionId
 * @param root0.conditionNameAndInclude
 * @param root0.handleConditionSelection
 * @returns A component for display to redner on the query building page
 */
const ConditionOption: React.FC<ConditionOptionProps> = ({
  conditionId,
  conditionNameAndInclude,
  handleConditionSelection,
}) => {
  return (
    <div className="margin-y-2">
      <Checkbox
        onClick={() => {
          handleConditionSelection(conditionId);
        }}
        id={conditionId}
        label={formatDiseaseDisplay(conditionNameAndInclude.name)}
      />
    </div>
  );
};

export default ConditionOption;
