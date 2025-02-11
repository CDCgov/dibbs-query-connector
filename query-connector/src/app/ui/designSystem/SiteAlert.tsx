import { Mode, PageType } from "@/app/shared/constants";
import { Alert } from "@trussworks/react-uswds";

export const CONTACT_US_DISCLAIMER_TEXT =
  "Interested in learning more about using the TEFCA Query Connector for your jurisdiction?";

export const CONTACT_US_DISCLAIMER_EMAIL = "dibbs@cdc.gov";

const contactUsDisclaimer = (
  <>
    {CONTACT_US_DISCLAIMER_TEXT}{" "}
    <a
      href="mailto:dibbs@cdc.gov"
      style={{
        color: "inherit",
        fontWeight: "bold",
        textDecoration: "underline",
      }}
    >
      {CONTACT_US_DISCLAIMER_EMAIL}
    </a>
  </>
);
const piiDisclaimer = (
  <>
    This site is for demo purposes only. Please do not enter PII on this
    website.
  </>
);

type SiteAlertProps = {
  page?: PageType | string;
};

const PageModeToSiteAlertMap: { [page in Mode]?: React.ReactNode } = {
  search: piiDisclaimer,
  "patient-results": piiDisclaimer,
  "select-query": piiDisclaimer,
  results: contactUsDisclaimer,
};

/**
 *
 * @param root0 - params
 * @param root0.page - the page we're currently on
 * @returns A conditionally-rendered site view page component depending on the
 * semantic context
 */
const SiteAlert: React.FC<SiteAlertProps> = ({ page }) => {
  const mappedAlert = PageModeToSiteAlertMap[page as Mode];

  return (
    <Alert type="info" headingLevel="h4" slim className="custom-alert">
      {mappedAlert ?? piiDisclaimer}
    </Alert>
  );
};

export default SiteAlert;
