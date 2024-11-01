import Image from "next/image";
import styles from "./footer.module.scss";
import classNames from "classnames";

/**
 * Produces the footer.
 * @returns The footer component.
 */
export default function FooterComponent() {
  return (
    <footer className={classNames("usa-footer", styles.footerContainer)}>
      <div className={styles.cdcLogoContainer}>
        <div>
          <Image
            src="/tefca-viewer/CDC_logo.png"
            alt="CDC logo"
            width={62}
            height={36}
            className="usa-footer__logo-img"
          />
        </div>
        <div>
          <p className="text-base-lightest">
            Centers for Disease Control and Prevention
          </p>
        </div>
      </div>
      <div className={styles.contactUsContainer}>
        <div className="width-fit-content">
          <p className="text-base-lightest">
            For more information about this solution, send us an email at{" "}
            <a className="text-base-lightest" href="mailto:dibbs@cdc.gov">
              dibbs@cdc.gov
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
