"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button, Icon } from "@trussworks/react-uswds";
import styles from "./header.module.scss";
import { metadata } from "@/app/shared/constants";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LOGGED_IN_PATHS, PAGES } from "@/app/shared/page-routes";
import { UserRole } from "@/app/models/entities/user-management";

/**
 * Produces the header.
 * @param root0 - The properties object
 * @param root0.authDisabled - The server-side read of the auth disabled environment variable.
 * @returns The HeaderComponent component.
 */
const HeaderComponent: React.FC<{ authDisabled: boolean }> = ({
  authDisabled,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

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

  const { status, data: session } = useSession();

  const isLoggedIn = status === "authenticated";
  const role = session?.user.role;

  const handleSignIn = () => {
    if (authDisabled) {
      router.push(PAGES.QUERY);
    } else {
      signIn("keycloak", { redirectTo: PAGES.QUERY });
    }
  };

  const handleSignOut = async () => {
    if (authDisabled) {
      router.push(PAGES.LANDING);
    } else {
      await signOut({ redirectTo: PAGES.LANDING });
    }
  };

  const toggleMenuDropdown = () => {
    setShowMenu(!showMenu);
  };
  // const isProduction = process.env.NODE_ENV === "production";
  const landingPage: string =
    authDisabled || isLoggedIn ? PAGES.QUERY : PAGES.LANDING;

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
                <Link
                  className="font-mono-lg text-base-lightest-important font-weight-normal-important"
                  href={landingPage}
                  title={metadata.title}
                >
                  {metadata.title}
                </Link>
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
            {!authDisabled &&
              status === "unauthenticated" &&
              !LOGGED_IN_PATHS.includes(path as PAGES) && (
                <Button
                  className={styles.signinButton}
                  type="button"
                  id="signin-button"
                  title={"Sign in button"}
                  onClick={handleSignIn}
                >
                  Sign in
                </Button>
              )}
            {LOGGED_IN_PATHS.includes(path as PAGES) && (
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
                data-testid="menu-button"
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
        {showMenu && (
          <div ref={menuRef} className={styles.menuDropdownContainer}>
            <ul
              id="dropdown-menu"
              data-testid="dropdown-menu"
              className={classNames("usa-nav__submenu", styles.menuDropdown)}
            >
              <>
                <li className={styles.subMenuItem}>
                  <Link
                    className={styles.menuItem}
                    href={PAGES.QUERY_BUILDING}
                    scroll={false}
                  >
                    My Queries
                  </Link>
                </li>
                <li className={styles.subMenuItem}>
                  <Link
                    className={styles.menuItem}
                    href={PAGES.FHIR_SERVERS}
                    scroll={false}
                  >
                    FHIR Servers
                  </Link>
                </li>
                {(authDisabled ||
                  role == UserRole.ADMIN ||
                  role == UserRole.SUPER_ADMIN) && (
                  <li className={styles.subMenuItem}>
                    <Link
                      className={styles.menuItem}
                      href={PAGES.USER_MANAGEMENT}
                      scroll={false}
                    >
                      User Management
                    </Link>
                  </li>
                )}
                <li className={styles.subMenuItem}>
                  <button
                    className={classNames(
                      styles.menuItem,
                      "usa-button--unstyled",
                    )}
                    onClick={async () => await handleSignOut()}
                  >
                    Log out
                  </button>
                </li>
              </>
            </ul>
          </div>
        )}
      </header>
    </div>
  );
};

export default HeaderComponent;
