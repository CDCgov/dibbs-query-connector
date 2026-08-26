import { Alert, AlertText } from "@trussworks/react-uswds";
import { ReactNode } from "react";

const PII_DISCLAIMER_BANNER = (
  <Alert type="info" slim className="custom-alert">
    <AlertText>
      This site is for demo purposes only. Please do not enter PII on this
      website.
    </AlertText>
  </Alert>
);
const CONTACT_US_BANNER = (
  <Alert type="info" slim className="custom-alert">
    <AlertText>
      Interested in learning more about using the TEFCA Query Connector for your
      jurisdiction? Send us an email at{" "}
      <a
        href="mailto:dibbs@cdc.gov"
        style={{
          color: "inherit",
          fontWeight: "bold",
          textDecoration: "underline",
        }}
      >
        dibbs@cdc.gov
      </a>
    </AlertText>
  </Alert>
);

export const alertBannerMap: { [mode: string]: ReactNode } = {
  search: PII_DISCLAIMER_BANNER,
  customize_query: PII_DISCLAIMER_BANNER,
  results: CONTACT_US_BANNER,
};
