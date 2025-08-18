import Image from "next/image";
import styles from "./footer.module.scss";
import classNames from "classnames";

/**
 * Produces the footer.
 * @returns The footer component.
 */
export default function FooterComponent() {
  return (
    <footer className={classNames("usa-footer--slim", styles.footerContainer)}>
      <section
        className={classNames(
          styles.footerContainer__desktop,
          "grid-container",
        )}
      >
        <div className="grid-row">
          <div
            className={classNames(
              styles.textContainer,
              "tablet:grid-col-auto",
              "grid-row tablet:grid-col-6",
            )}
          >
            <Image
              src="/CDC_logo.png"
              alt="Centers for Disease Control and Prevention"
              width={62}
              height={32}
              className="usa-footer__logo-img"
            />
            <p
              className={classNames(
                "brand-lightest",
                styles.textContainer,
                styles.textContainer__left,
                "margin-left-12",
              )}
            >
              Centers for Disease Control and Prevention
            </p>
          </div>
          <div
            className={classNames(
              styles.textContainer,
              styles.textContainer__right,
              "tablet:grid-col-auto",
              "grid-row tablet:grid-col-6",
            )}
          >
            <p className="brand-lightest">
              For more information about this solution, send us an email at{" "}
              <a className="brand-lightest" href="mailto:dibbs@cdc.gov">
                dibbs@cdc.gov
              </a>
            </p>
          </div>
        </div>
      </section>
      <section
        className={classNames(styles.footerContainer__mobile, "grid-container")}
      >
        <div className={classNames(styles.stacked, "grid-row")}>
          <Image
            src="/CDC_logo.png"
            alt="Centers for Disease Control and Prevention"
            width={62}
            height={32}
            className="usa-footer__logo-img grid-col-2"
          />
          <div
            className={classNames(
              styles.textContainer,
              "tablet:grid-col-auto",
              "grid-row tablet:grid-col-5",
            )}
          >
            <p
              className={classNames(
                "brand-lightest",
                styles.textContainer,
                styles.textContainer__left,
                "margin-left-12",
              )}
            >
              Centers for Disease Control and Prevention
            </p>
            <p className="brand-lightest">
              For more information about this solution, send us an email at{" "}
              <a className="brand-lightest" href="mailto:dibbs@cdc.gov">
                dibbs@cdc.gov
              </a>
            </p>
          </div>
        </div>
      </section>
    </footer>
  );
}
