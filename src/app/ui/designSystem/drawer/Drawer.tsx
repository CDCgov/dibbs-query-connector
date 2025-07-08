import React, { useEffect, useState } from "react";
import { Icon } from "@trussworks/react-uswds";
import styles from "./drawer.module.scss";
import SearchField from "../searchField/SearchField";
import classNames from "classnames";
import FocusTrap from "focus-trap-react";

type DrawerProps = {
  title: string | React.ReactNode;
  subtitle?: string;
  placeholder: string;
  toastMessage?: string;
  toRender: React.ReactNode;
  isOpen: boolean;
  onSave: () => void;
  onClose: () => void;
  onSearch?: (searchFilter: string) => void;
  drawerWidth?: "35%" | "60%";
  returnFocusElement?: HTMLElement | null;
};

/**
 * Drawer component to review and refine changes to conditions or concepts.
 * @param root0 - props
 * @param root0.title - The title displayed in the drawer.
 * @param root0.subtitle - The drawer subtitle
 * @param root0.placeholder - The placeholder text for the search field.
 * @param root0.onClose - Function to handle closing the drawer.
 * @param root0.onSearch - Function to handle search actions in the drawer.
 * @param root0.isOpen - Boolean to control the visibility of the drawer.
 * @param root0.toRender - The dynamic content to display.
 * @param root0.drawerWidth - The width of the drawer, default is 35%.
 * @param root0.returnFocusElement - The width of the drawer, default is 35%.
 * warning modal appears before saving
 * @returns The Drawer component.
 */
const Drawer: React.FC<DrawerProps> = ({
  title,
  subtitle,
  placeholder,
  isOpen,
  onClose,
  toRender,
  onSearch,
  drawerWidth = "35%",
  returnFocusElement,
}: DrawerProps) => {
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    // do this in a useEffect rather than in the JSX so that we can control
    // a drawer-specific search vs a filter passed in from the parent component
    if (onSearch) {
      onSearch(searchFilter);
    }
  }, [searchFilter]);

  function handleClose() {
    console.log("innermost handle close");
    setSearchFilter("");
    onClose();
  }

  // useEffect(() => {
  //   const handleEscape = (evt: KeyboardEvent) => {
  //     evt = evt || window.event;
  //     if (isOpen && (evt.key === "Escape" || evt.key === "Esc")) {
  //       handleClose();
  //     }
  //   };
  //   window.addEventListener("keyup", handleEscape);
  //   // Cleanup
  //   return () => {
  //     window.removeEventListener("keyup", handleEscape);
  //   };
  // }, []);

  return (
    <FocusTrap
      active={isOpen}
      focusTrapOptions={{
        onDeactivate: handleClose,
        escapeDeactivates: true,
        setReturnFocus(nodeFocusedBeforeActivation) {
          console.log(returnFocusElement);
          return returnFocusElement ?? nodeFocusedBeforeActivation;
        },
      }}
    >
      <div>
        <div
          className={classNames(
            styles.drawer,
            isOpen ? styles.open : styles.closed,
            drawerWidth === "60%" ? styles.width60 : styles.width35,
          )}
          role="dialog"
          id="drawer-container"
          aria-label="drawer-container"
          data-testid={`drawer-open-${isOpen}`}
        >
          <div
            className={classNames(
              styles.drawerContent,
              isOpen ? "display-block" : "display-none",
            )}
          >
            <div className={styles.drawerHeader}>
              <button
                className={styles.closeButton}
                onClick={() => handleClose()}
                aria-label="Close drawer"
                data-testid={"close-drawer"}
              >
                <Icon.Close size={3} aria-label="X icon indicating closure" />
              </button>
              <h2
                id="drawer-title"
                data-testid={`drawer-title`}
                className={classNames(
                  "margin-0",
                  subtitle ? "padding-bottom-0" : "padding-bottom-2",
                )}
              >
                {title}
              </h2>
              {subtitle ? (
                <h3 className={styles.subtitle}>{subtitle}</h3>
              ) : (
                <></>
              )}

              {onSearch && (
                <div>
                  <SearchField
                    id="searchFieldTemplate"
                    placeholder={placeholder}
                    value={searchFilter}
                    onChange={(e) => {
                      e.preventDefault();
                      setSearchFilter(e.target.value);
                    }}
                  />
                </div>
              )}
            </div>

            <div className={classNames(styles.drawerBody)}>{toRender}</div>
          </div>
        </div>

        {isOpen && <div className={styles.overlay} onClick={handleClose}></div>}
      </div>
    </FocusTrap>
  );
};

export default Drawer;
