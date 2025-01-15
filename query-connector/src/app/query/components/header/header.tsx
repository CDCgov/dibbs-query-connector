"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@trussworks/react-uswds";
import styles from "./header.module.scss";
import { metadata } from "@/app/constants";
import classNames from "classnames";
/**
 * Produces the header.
 * @returns The HeaderComponent component.
 */
export default function HeaderComponent() {
  const menuRef = useRef<HTMLDivElement>(null);

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
    document.addEventListener("mousedown", outsideMenuClick);

    return () => {
      document.removeEventListener("mousedown", outsideMenuClick);
    };
  }, [showMenu]);

  const path = usePathname();

  // const { data: session } = useSession();
  // const isLoggedIn = session?.user != null;

  // const handleSignIn = () => {
  //   signIn("keycloak", { redirectTo: "/query" });
  // };

  const toggleMenuDropdown = () => {
    setShowMenu(!showMenu);
  };
  // const isProduction = process.env.NODE_ENV === "production";
  const landingPage = "/";

  return (
    <div className={styles.headerContainer}>
      <header className="usa-header usa-header--basic">
        <div
          className={classNames(
            "usa-nav-container",
            styles.headerContentContainer,
          )}
        >
          <div className={classNames("display-flex", "flex-align-center")}>
            <div className="usa-logo" style={{ marginLeft: "0" }}>
              <em className="usa-logo__text text-base-lightest-important">
                <a
                  className="font-mono-lg text-base-lightest-important font-weight-normal-important"
                  href={landingPage}
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
              "flex-align-center",
            )}
          >
            {/* TODO: Enable this once we can show/hide rules based on actual auth status */}
            {/* {!isLoggedIn && !LOGGED_IN_PATHS.includes(path) && (
              <Button
                className={styles.signinButton}
                type="button"
                id="signin-button"
                title={"Sign in button"}
                onClick={handleSignIn}
              >
                Sign in
              </Button>
            )} */}
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

      {showMenu && (
        <div ref={menuRef} className={styles.menuDropdownContainer}>
          <ul
            id="dropdown-menu"
            className={`usa-nav__submenu ${styles.menuDropdown}`}
          >
            {/* TODO: Enable this once we can show/hide rules based on actual auth status */}
            {/* {isProduction && ( */}
            <>
              <li className={styles.subMenuItem}>
                <a className={styles.menuItem} href={"/queryBuilding"}>
                  My queries
                </a>
              </li>
              <li className={styles.subMenuItem}>
                <a className={styles.menuItem} href={"/fhir-servers"}>
                  FHIR Servers
                </a>
              </li>
              <li className={styles.subMenuItem}>
                <a className={styles.menuItem} href={landingPage}>
                  Log out
                </a>
              </li>
            </>
            {/* )} */}
          </ul>
        </div>
      )}
    </div>
  );
}

const LOGGED_IN_PATHS = ["/query", "/queryBuilding", "/fhir-servers"];
