"use client";

import { useEffect, useRef, useState } from "react";
import { Modal, ModalButton } from "../../designSystem/Modal";
import { useRouter, usePathname } from "next/navigation";
import { Button, Icon, ModalRef } from "@trussworks/react-uswds";
import styles from "./header.module.css";
import { metadata } from "@/app/constants";
import classNames from "classnames";
/**
 * Produces the header.
 * @returns The HeaderComponent component.
 */
export default function HeaderComponent() {
  const modalRef = useRef<ModalRef>(null);
  const [isClient, setIsClient] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const router = useRouter();
  const path = usePathname();

  const handleClick = () => {
    router.push(`/signin`);
  };

  const toggleMenuDropdown = () => {
    setShowMenu(!showMenu);
  };
  const backLink =
    process.env.NODE_ENV === "production" ? "/tefca-viewer" : "/";

  const isProduction = process.env.NODE_ENV === "production";

  return (
    <>
      <header className="usa-header usa-header--basic bg-primary-darker">
        <div
          className={classNames(
            "header-footer-content",
            "usa-nav-container",
            styles.headerContentContainer,
          )}
        >
          <div className={classNames("display-flex", "flex-align-center")}>
            <div className="usa-logo margin-left-1">
              <em className="usa-logo__text text-base-lightest">
                <a className="siteTitle" href={backLink} title={metadata.title}>
                  {metadata.title}
                </a>
              </em>
            </div>
          </div>
          <div
            className={classNames(
              "margin-left-auto",
              "display-flex",
              "flex-align-center",
            )}
          >
            {path != "/signin" && isClient && (
              <ModalButton
                modalRef={modalRef}
                title={"Data Usage Policy"}
                className={styles.dataUsagePolicyButton}
              />
            )}
            {/* TODO: Rework show/hide rules based on actual auth status */}
            {path != "/signin" && !LOGGED_IN_PATHS.includes(path) && (
              <Button
                className={styles.signinButton}
                type="button"
                id="signin-button"
                title={"Sign in button"}
                onClick={() => handleClick()}
              >
                Sign in
              </Button>
            )}
            {LOGGED_IN_PATHS.includes(path) && (
              <button
                onClick={toggleMenuDropdown}
                className={classNames(
                  styles.menuButton,
                  "usa-accordion__button",
                  "usa-nav__link",
                  "usa-current",
                )}
                aria-expanded="false"
                aria-controls="dropdown-menu"
              >
                <Icon.Settings
                  className="usa-icon qc-settings"
                  size={3}
                  color="#fff"
                  aria-label="Gear icon indicating settings menu"
                />
              </button>
            )}
          </div>
        </div>
      </header>

      {isClient && (
        <Modal
          modalRef={modalRef}
          id="data-usage-policy"
          heading="How is my data stored?"
          description="It's not! Data inputted into the TEFCA Query Connector is not persisted or stored anywhere."
        ></Modal>
      )}

      {showMenu && (
        <div className={styles.menuDropdownContainer}>
          <ul
            id="dropdown-menu"
            className={`usa-nav__submenu ${styles.menuDropdown}`}
          >
            {!isProduction && (
              <li className={`usa-nav__submenu-item`}>
                <a className={styles.menuItem} href={"/queryBuilding"}>
                  My queries
                </a>
              </li>
            )}
            <li className={`usa-nav__submenu-item`}>
              <a className={styles.menuItem} href={backLink}>
                Log out
              </a>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}

const LOGGED_IN_PATHS = ["/query", "/queryBuilding"];
