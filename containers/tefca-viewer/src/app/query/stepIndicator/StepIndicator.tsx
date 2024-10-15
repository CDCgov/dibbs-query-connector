import { Mode } from "@/app/constants";
import {
  StepIndicator as TrussStepIndicator,
  StepIndicatorStep,
  HeadingLevel,
} from "@trussworks/react-uswds";
import styles from "./stepIndicator.module.css";

type StepIndicatorProps = {
  headingLevel: HeadingLevel;
  curStep: Mode;
};
type StepStatus = "current" | "complete" | "incomplete";

export const CUSTOMIZE_QUERY_STEPS: { [mode: string]: string } = {
  search: "Enter patient info",
  "patient-results": "Select patient",
  "select-query": "Select query",
  results: "View patient record",
};

/**
 * Step indicator for the query process
 * 
 * @param root0 - The props for the StepIndicator component.
 * @param root0.headingLevel - The heading level for the step indicator.
 * @param root0.curStep - The current step in the query process.
 * @returns The step indicator component showing the current progress.
 */
const StepIndicator: React.FC<StepIndicatorProps> = ({
  headingLevel,
  curStep,
}) => {
  const stepArray = Object.keys(CUSTOMIZE_QUERY_STEPS).map((key, index) => {
    return { [key]: index };
  });
  const stepOrder = Object.assign({}, ...stepArray);

  return (
    <TrussStepIndicator
      headingLevel={headingLevel}
      counters="default"
      className={`custom-query-step-indicator ${styles.container}`}
    >
      {Object.values(CUSTOMIZE_QUERY_STEPS).map((label, index) => {
        let status = "incomplete";
        if (stepOrder[curStep] === index) {
          status = "current";
        } else if (stepOrder[curStep] > index) {
          status = "complete";
        }
        return (
          <StepIndicatorStep label={label} status={status as StepStatus} />
        );
      })}
    </TrussStepIndicator>
  );
};

export default StepIndicator;
