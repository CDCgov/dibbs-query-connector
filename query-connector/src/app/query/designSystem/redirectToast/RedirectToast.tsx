import { Alert, HeadingLevel } from "@trussworks/react-uswds";
import { toast } from "react-toastify";
import classNames from "classnames";

export type AlertType = "info" | "success" | "warning" | "error";

type RedirectToastProps = {
  toastVariant: AlertType;
  heading: string;
  body: string;
  headingLevel?: HeadingLevel;
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
const RedirectToast: React.FC<RedirectToastProps> = ({
  toastVariant,
  heading,
  body,
  headingLevel,
}) => {
  const headingClass = headingLevel ? `h${headingLevel.slice(1)}` : "h4";
  return (
    <Alert
      type={toastVariant}
      heading={
        <span className={`usa-alert__heading ${headingClass}`}>{heading}</span>
      }
      headingLevel={headingLevel ? headingLevel : "h4"}
    >
      {body}
    </Alert>
  );
};

const options = {
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
 * @param content.duration - Duration in milliseconds for how long the toast is visible. Defaults to 5000ms.
 */
export function showToastConfirmation(content: {
  heading: string;
  body?: string;
  variant?: AlertType;
  headingLevel?: HeadingLevel;
  duration?: number;
}) {
  const toastVariant = content.variant ?? "success";
  const toastDuration = content.duration ?? 5000; // Default to 5000ms

  toast[toastVariant](
    <RedirectToast
      toastVariant={toastVariant}
      heading={content.heading}
      headingLevel={content.headingLevel}
      body={content.body ?? ""}
    />,
    { ...options, autoClose: toastDuration },
  );
}

export default RedirectToast;
