import { Alert, HeadingLevel } from "@trussworks/react-uswds";
import { toast, ToastPosition } from "react-toastify";
import type { ToastIcon } from "../../../../../node_modules/react-toastify/dist/types";
import classNames from "classnames";

export type AlertType = "info" | "success" | "warning" | "error";

type ToastProps = {
  toastVariant: AlertType;
  heading?: string;
  body: string;
  headingLevel?: HeadingLevel;
  hideProgressBar?: boolean;
};
/**
 * Redirection toast to be invoked when there's a need to confirm with the user
 * something has occurred
 * @param root0 - The config object to specify content / styling of the toast
 * @param root0.toastVariant - A string from the enum set "info" | "success" | "warning" | "error"
 * indicating what type of toast variant we want. Will style the USWDS component accordingly
 * @param root0.heading - The heading / title of the alert
 * @param root0.body - The body content of the alert
 * @param root0.headingLevel - string of h1-6 indicating which heading level the alert will be.
 * defaults to h4
 * @returns A toast component using the USWDS alert
 */
const Toast: React.FC<ToastProps> = ({
  toastVariant,
  heading,
  body,
  headingLevel = "h4",
}) => {
  return (
    <Alert
      type={toastVariant}
      heading={
        heading ? (
          <span className={`usa-alert__heading ${headingLevel}`}>
            {heading}
          </span>
        ) : undefined
      }
      headingLevel={heading ? headingLevel : "h4"}
    >
      {body}
    </Alert>
  );
};

export type ToastConfigOptions = {
  position?: ToastPosition;
  stacked?: boolean;
  hideProgressBar?: boolean;
  closeOnClick?: boolean;
  closeButton?: boolean;
  className?: string;
  bodyClassName?: string;
  pauseOnFocusLoss?: boolean;
  icon?: ToastIcon;
};

const options: ToastConfigOptions = {
  // uncomment this to debug toast styling issues
  // progress: 0.2,
  hideProgressBar: false,
  position: "bottom-left" as const,
  closeOnClick: true,
  closeButton: false,
  className: classNames("padding-0-important", "margin-top-0-important"),
  bodyClassName: classNames("padding-0-important", "margin-top-0-important"),
  pauseOnFocusLoss: false,
};

/**
 *
 * @param content - content object to configure the redirect confirmation toast
 * @param content.heading - heading of the redirect toast
 * @param content.variant - one of "info", "success", "warning", "error" to
 * render the relevant toast variant
 * @param content.body - body text of the redirect toast
 * @param content.headingLevel - h1-6 level of the heading tag associated with
 * content.heading. defaults to h4
 * @param content.hideProgressBar - Whether to hide the rendering of the progress bar
 * @param content.duration - Duration in milliseconds for how long the toast is visible. Defaults to 5000ms.
 */
export function showToastConfirmation(content: {
  body: string;
  heading?: string;
  variant?: AlertType;
  headingLevel?: HeadingLevel;
  duration?: number;
  hideProgressBar?: boolean;
}) {
  const toastVariant = content.variant ?? "success";
  const toastDuration = content.duration ?? 5000; // Default to 5000ms
  const hideProgressBar = content.hideProgressBar ?? false;

  toast[toastVariant](
    <Toast
      toastVariant={toastVariant}
      heading={content.heading}
      headingLevel={content.headingLevel}
      body={content.body ?? ""}
    />,
    { ...options, autoClose: toastDuration, hideProgressBar: hideProgressBar },
  );
}

export default Toast;
