import { Mode } from "@/app/constants";
import { PAGE_TITLES } from "./StepIndicator";

type TitleBoxProps = {
  step: Mode;
};

/**
 * TitleBob that renders the page title and step counter state
 * along the customize query flow
 * @param root0 params
 * @param root0.step - The step of the customize query flow we're on
 * @returns A component that renders the title and the step counter state
 */
const TitleBox: React.FC<TitleBoxProps> = ({ step }) => {
  return (
    <div className="margin-top-3">
      <span className="usa-step-indicator__heading-counter">
        <span className="usa-step-indicator__current-step">
          {PAGE_TITLES[step].step}
        </span>
        <span className="usa-step-indicator__total-steps">
          of {Object.keys(PAGE_TITLES).length}
        </span>
        <h1 className="page-title display-inline">{PAGE_TITLES[step].title}</h1>
      </span>
    </div>
  );
};

export default TitleBox;
