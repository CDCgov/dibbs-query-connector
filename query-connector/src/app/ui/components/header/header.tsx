"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button, Icon } from "@trussworks/react-uswds";
import styles from "./header.module.scss";
import { metadata } from "@/app/shared/constants";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSettingsMenuPages, PAGES } from "@/app/shared/page-routes";
import { RoleTypeValues } from "@/app/models/entities/user-management";

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
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const userRole = authDisabled
    ? RoleTypeValues.SuperAdmin
    : session?.user.role || "";

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
            {!authDisabled && status === "unauthenticated" ? (
              <Button
                className={styles.signinButton}
                type="button"
                id="signin-button"
                title={"Sign in button"}
                onClick={handleSignIn}
              >
                Sign in
              </Button>
            ) : (
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
              className={classNames("usa-nav__submenu", styles.menuDropdown)}
            >
              {getSettingsMenuPages(userRole as RoleTypeValues).map((page) => (
                <li className={styles.subMenuItem}>
                  <Link
                    className={styles.menuItem}
                    href={page.path}
                    scroll={false}
                  >
                    {page.name}
                  </Link>
                </li>
              ))}
              {!authDisabled && (
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
              )}
            </ul>
          </div>
        )}
      </header>
    </div>
  );
};

export default HeaderComponent;
