import { Mode } from "@/app/constants";
import {
  StepIndicator as TrussStepIndicator,
  StepIndicatorStep,
  HeadingLevel,
} from "@trussworks/react-uswds";
import styles from "./stepIndicator.module.scss";
import classNames from "classnames";

type StepIndicatorProps = {
  headingLevel: HeadingLevel;
  curStep: Mode;
  className?: string;
};
type StepStatus = "current" | "complete" | "incomplete";

// Steps in the step indicator
export const CUSTOMIZE_QUERY_STEPS: { [mode in Mode]: string } = {
  search: "Enter patient info",
  "patient-results": "Select patient",
  "select-query": "Select query",
  results: "View patient record",
};

// Steps in the header level title
export const PAGE_TITLES: { [mode in Mode]: string } = {
  search: "Step 1: Enter patient information",
  "patient-results": "Step 2: Select a patient",
  "select-query": "Step 3: Select a query",
  results: "Patient Record",
};

// Steps in the return to previous page
export const RETURN_LABEL: { [mode in Mode]: string } = {
  "patient-results": "Return to Enter patient info",
  "select-query": "Return to Select patient",
  results: "Return to Select query",
  search: "",
};

/**
 * Step indicator for the query process
 * @param root0 - The props for the StepIndicator component.
 * @param root0.headingLevel - The heading level for the step indicator.
 * @param root0.curStep - The current step in the query process.
 * @param root0.className - Custom styles for the container
 * @returns The step indicator component showing the current progress.
 */
const StepIndicator: React.FC<StepIndicatorProps> = ({
  headingLevel,
  curStep,
  className,
}) => {
  const stepArray = Object.keys(CUSTOMIZE_QUERY_STEPS).map((key, index) => {
    return { [key]: index };
  });
  const stepOrder = Object.assign({}, ...stepArray);

  return (
    <TrussStepIndicator
      headingLevel={headingLevel}
      counters="default"
      className={classNames(
        "custom-query-step-indicator",
        styles.container,
        className,
      )}
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
