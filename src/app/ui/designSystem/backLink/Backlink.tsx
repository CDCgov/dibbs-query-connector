import { Icon } from "@trussworks/react-uswds";
import { RefObject } from "react";

type BacklinkProps = {
  onClick: () => void;
  label: string;
  ref?: RefObject<HTMLAnchorElement | null>;
};

/**
 *
 * @param root0 - params
 * @param root0.onClick - function to handle a click (likely a goBack function)
 * @param root0.label - Link label to display
 * @param root0.ref - Optional ref object for focus control
 * @returns A backlink component styled according to Figma
 */
const Backlink: React.FC<BacklinkProps> = ({ onClick, label, ref }) => {
  return (
    <a
      ref={ref}
      href="#"
      onClick={onClick}
      className="back-link text-no-underline width-fit-content"
      aria-label={`Back arrow, ${label}`}
      data-testid="backArrowLink"
    >
      <Icon.ArrowBack aria-label="Arrow point left indicating return to previous step" />{" "}
      {label}
    </a>
  );
};

export default Backlink;
