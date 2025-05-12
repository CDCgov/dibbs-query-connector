"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import { Button, Icon } from "@trussworks/react-uswds";
import styles from "./header.module.scss";
import { metadata } from "@/app/shared/constants";
import classNames from "classnames";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getPagesInSettingsMenu, PAGES } from "@/app/shared/page-routes";
import { UserRole } from "@/app/models/entities/users";
import { isAuthDisabledClientCheck } from "@/app/utils/auth";
import { DataContext } from "@/app/shared/DataProvider";
import { signOut } from "@/app/backend/session-management";
import { Session } from "next-auth";

interface HeaderProps {
  session: Session | null;
}
/**
 * Produces the header.
 * @param param0 - param
 * @param param0.session - whether user is logged in
 * @returns The HeaderComponent component.
 */
const HeaderComponent: React.FC<HeaderProps> = ({ session }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const ctx = useContext(DataContext);
  const isAuthDisabled = isAuthDisabledClientCheck(ctx?.runtimeConfig);

  const isLoggedIn = session !== null || isAuthDisabled;

  const userRole = isAuthDisabled
    ? UserRole.SUPER_ADMIN
    : session?.user?.role || "";

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

  const handleSignOut = async () => {
    if (isAuthDisabled) {
      router.push(PAGES.LANDING);
    } else {
      setShowMenu(false);
      await signOut({ redirectTo: PAGES.LANDING });
    }
  };

  const toggleMenuDropdown = () => {
    setShowMenu(!showMenu);
  };

  const landingPage =
    isAuthDisabled || isLoggedIn ? PAGES.QUERY : PAGES.LANDING;

  const menuPages = getPagesInSettingsMenu(userRole as UserRole).filter(
    (page) => page.path !== PAGES.QUERY,
  );

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
            <div className={styles.siteLogo}>
              <em className="usa-logo__text brand-lightest">
                <Link
                  className="font-mono-lg brand-lightest font-weight-normal-important"
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
            {isLoggedIn && (
              <div className="display-flex flex-align-center">
                <Button
                  secondary
                  onClick={() => {
                    router.push(PAGES.QUERY);
                  }}
                  className={classNames("margin-bottom-0 margin-right-2")}
                  type={"button"}
                >
                  Run a query
                </Button>
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
              </div>
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
              {menuPages.map((page) => (
                <li key={page.path} className={styles.subMenuItem}>
                  <button
                    type="button"
                    className={classNames(
                      styles.menuItem,
                      "usa-button--unstyled",
                    )}
                    onClick={() => {
                      if (pathname === page.path) {
                        location.reload();
                      } else {
                        router.push(page.path);
                      }
                      setShowMenu(false);
                    }}
                  >
                    {page.name}
                  </button>
                </li>
              ))}
              {!isAuthDisabled && (
                <li className={styles.subMenuItem}>
                  <button
                    className={classNames(styles.menuItem)}
                    onClick={async () => await handleSignOut()}
                  >
                    Sign out
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </header>
    </div>
  );
};

export default HeaderComponent;
