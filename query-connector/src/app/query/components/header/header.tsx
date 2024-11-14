"use client";

import { useEffect, useRef, useState } from "react";
import { Modal, ModalButton } from "../../designSystem/Modal";
import { useRouter, usePathname } from "next/navigation";
import { Button, Icon, ModalRef } from "@trussworks/react-uswds";
import styles from "./header.module.scss";
import { metadata } from "@/app/constants";
import classNames from "classnames";
/**
 * Produces the header.
 * @returns The HeaderComponent component.
 */
export default function HeaderComponent() {
  const modalRef = useRef<ModalRef>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isClient, setIsClient] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const outsideMenuClick = (event: MouseEvent) => {
    if (
      showMenu &&
      menuRef.current &&
      !menuRef.current.contains(event.target as Node)
    ) {
      setShowMenu(false);
    }
  };

  useEffect(() => {
    setIsClient(true);

    document.addEventListener("mousedown", outsideMenuClick);

    return () => {
      document.removeEventListener("mousedown", outsideMenuClick);
    };
  }, [showMenu]);

  const router = useRouter();
  const path = usePathname();

  const handleClick = () => {
    router.push(`/signin`);
  };

  const toggleMenuDropdown = () => {
    setShowMenu(!showMenu);
  };
  const isProduction = process.env.NODE_ENV === "production";
  const backLink = isProduction ? "/query-connector" : "/";

  return (
    <>
      <header className="usa-header usa-header--basic bg-primary-darker">
        <div
          className={classNames(
            "usa-nav-container",
            styles.headerContentContainer
          )}
        >
          <div className={classNames("display-flex", "flex-align-center")}>
            <div className="usa-logo" style={{ marginLeft: "0" }}>
              <em className="usa-logo__text text-base-lightest-important">
                <a
                  className="font-mono-lg text-base-lightest-important font-weight-normal-important"
                  href={backLink}
                  title={metadata.title}
                >
                  {metadata.title}
                </a>
              </em>
            </div>
          </div>
          <div
            className={classNames(
              "margin-left-auto",
              "display-flex",
              "flex-align-center"
            )}
          >
            {path != "/signin" && isClient}
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
                  "usa-current"
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
        <div ref={menuRef} className={styles.menuDropdownContainer}>
          <ul
            id="dropdown-menu"
            className={`usa-nav__submenu ${styles.menuDropdown}`}
          >
            {!isProduction && (
              <li className={styles.subMenuItem}>
                <a className={styles.menuItem} href={"/queryBuilding"}>
                  My queries
                </a>
              </li>
            )}
            <li className={styles.subMenuItem}>
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
